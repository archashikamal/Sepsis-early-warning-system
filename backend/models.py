"""
Model class definitions for the Sepsis Early-Warning System.

Architecture is reconstructed to exactly match the state_dict produced during training.
Key weight shapes (verified against best_model_weights.pt):
  lstm.weight_ih_l0  : [128, 8]   → LSTM input_size=8, hidden_size=32 (4*32=128 gates)
  lstm.weight_hh_l0  : [128, 32]
  attn.weight        : [1, 32]    → linear attention scorer
  classifier.0.weight: [16, 32]   → first FC layer
  classifier.3.weight: [1, 16]    → output logit (index 3 = after ReLU+Dropout)
"""

import torch
import torch.nn as nn
import torch.nn.functional as F


class AttnLSTM(nn.Module):
    """
    LSTM with additive (Bahdanau-style) self-attention over timesteps.

    Forward pass:
      1. LSTM encodes the sequence  →  hidden states [B, T, H]
      2. A single linear layer scores each timestep  →  [B, T]
      3. Softmax produces attention weights           →  [B, T]  (sum to 1)
      4. Weighted sum of hidden states gives context  →  [B, H]
      5. A 2-layer classifier head outputs a logit   →  [B, 1]
      6. Sigmoid squashes to a risk score in [0, 1]

    Returns:
      risk_score  : Tensor [B, 1]   — sepsis risk probability
      attn_weights: Tensor [B, T]   — per-timestep attention weights
    """

    def __init__(
        self,
        n_features: int = 8,
        hidden_size: int = 32,
        num_layers: int = 1,
        dropout: float = 0.2,
    ):
        super().__init__()
        # dropout in nn.LSTM is only applied between layers (ignored when num_layers==1)
        lstm_dropout = dropout if num_layers > 1 else 0.0
        self.lstm = nn.LSTM(
            input_size=n_features,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=lstm_dropout,
        )
        # Attention scorer: maps each hidden state to a scalar score
        self.attn = nn.Linear(hidden_size, 1)

        # Classifier head — must match index positions in the state_dict:
        #   [0] Linear(32→16)
        #   [1] ReLU
        #   [2] Dropout
        #   [3] Linear(16→1)
        self.classifier = nn.Sequential(
            nn.Linear(hidden_size, 16),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(16, 1),
        )

    def forward(self, x: torch.Tensor):
        """
        Args:
            x: Tensor of shape [B, T, n_features]
        Returns:
            risk_score  : Tensor [B, 1]
            attn_weights: Tensor [B, T]
        """
        # 1. Encode sequence
        out, _ = self.lstm(x)                           # [B, T, H]

        # 2. Score each timestep
        scores = self.attn(out).squeeze(-1)             # [B, T]

        # 3. Normalize to probabilities
        attn_weights = torch.softmax(scores, dim=-1)    # [B, T]  (sums to 1)

        # 4. Context vector via weighted sum
        context = (attn_weights.unsqueeze(-1) * out).sum(dim=1)  # [B, H]

        # 5 & 6. Classify and squash
        logit = self.classifier(context)                # [B, 1]
        risk_score = torch.sigmoid(logit)               # [B, 1]

        return risk_score, attn_weights


# ---------------------------------------------------------------------------
# TCNClassifier — stub for future deployment, not currently loaded
# ---------------------------------------------------------------------------

class _TemporalBlock(nn.Module):
    """Dilated causal Conv1d block with residual connection."""

    def __init__(self, n_inputs, n_outputs, kernel_size, stride, dilation, padding, dropout=0.2):
        super().__init__()
        self.conv1 = nn.utils.parametrize.register_parametrization if False else \
            nn.Conv1d(n_inputs, n_outputs, kernel_size,
                      stride=stride, padding=padding, dilation=dilation)
        self.conv2 = nn.Conv1d(n_outputs, n_outputs, kernel_size,
                               stride=stride, padding=padding, dilation=dilation)
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(dropout)
        self.downsample = nn.Conv1d(n_inputs, n_outputs, 1) if n_inputs != n_outputs else None

    def _pad_causal(self, x, conv, padding):
        """Apply causal padding (remove future-leaked outputs)."""
        x = F.pad(x, (padding, 0))
        return conv(x)

    def forward(self, x):
        padding = (self.conv1.kernel_size[0] - 1) * self.conv1.dilation[0]
        out = self._pad_causal(x, self.conv1, padding)
        out = self.relu(out)
        out = self.dropout(out)
        out = self._pad_causal(out, self.conv2, padding)
        out = self.relu(out)
        out = self.dropout(out)
        res = x if self.downsample is None else self.downsample(x)
        return self.relu(out + res)


class TCNClassifier(nn.Module):
    """Temporal Convolutional Network with dilated causal convolutions."""

    def __init__(self, n_features=8, num_channels=None, kernel_size=3, dropout=0.2):
        super().__init__()
        if num_channels is None:
            num_channels = [32, 32, 32]
        layers = []
        for i, out_ch in enumerate(num_channels):
            dilation = 2 ** i
            in_ch = n_features if i == 0 else num_channels[i - 1]
            layers.append(_TemporalBlock(in_ch, out_ch, kernel_size,
                                         stride=1, dilation=dilation,
                                         padding=(kernel_size - 1) * dilation,
                                         dropout=dropout))
        self.network = nn.Sequential(*layers)
        self.classifier = nn.Linear(num_channels[-1], 1)

    def forward(self, x: torch.Tensor):
        # x: [B, T, F] → TCN expects [B, F, T]
        x = x.permute(0, 2, 1)
        out = self.network(x)           # [B, C, T]
        out = out[:, :, -1]             # last timestep  [B, C]
        logit = self.classifier(out)    # [B, 1]
        return torch.sigmoid(logit), None  # no attention weights for TCN


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

MODEL_REGISTRY = {
    "AttnLSTM": AttnLSTM,
    "TCNClassifier": TCNClassifier,
}


def build_model(model_config: dict) -> nn.Module:
    """Instantiate a model from a model_config dict (from model_metadata.json)."""
    model_type = model_config["model_type"]
    if model_type not in MODEL_REGISTRY:
        raise ValueError(
            f"Unknown model_type '{model_type}'. "
            f"Supported types: {list(MODEL_REGISTRY.keys())}"
        )
    cls = MODEL_REGISTRY[model_type]
    # Extract only the kwargs that the constructor accepts
    kwargs = {k: v for k, v in model_config.items() if k != "model_type"}
    return cls(**kwargs)
