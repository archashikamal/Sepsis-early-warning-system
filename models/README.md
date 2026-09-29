# 🧠 Trained Models & Metadata

This folder houses the pre-trained neural network weights and configuration metadata used by the Sepsis Early-Warning inference engine.

---

## 📁 Files

| File | Size | Description |
| :--- | :--- | :--- |
| `best_model_weights.pt` | ~28 KB | Serialized PyTorch state dictionary containing learned parameters for the best-performing architecture. |
| `model_metadata.json` | ~1.2 KB | Hyperparameter configurations, preprocessing parameters, feature ordering, and evaluation benchmarks. |

---

## 🔬 Model Architecture: `AttnLSTM`

The primary production model is an **Attention-augmented Long Short-Term Memory network (AttnLSTM)** designed for multivariate physiological time-series streaming.

- **Input Dimension:** 8 physiological features per timestamp
- **Sequence Length:** 8 timesteps (representing an 8-hour rolling observation window)
- **Hidden Units:** 32 units
- **Recurrent Layers:** 1
- **Dropout:** 0.2
- **Temporal Attention:** Multi-step additive attention mechanism over all 8 hidden states, outputting both the scalar prediction probability and normalized attention weights across each hour.

### Candidate Benchmark Comparison

Evaluated on synthetic and eICU-CRD demographic/vital cohorts:

| Metric | AttnLSTM (Selected) | TCN (Temporal Convolutional) |
| :--- | :---: | :---: |
| **AUROC** | **0.9813** | 0.9803 |
| **AUPRC** | **0.7873** | 0.7818 |
| **False Alarms / Patient-Day** | **0.47** | 0.74 |
| **Median Lead Time** | 8.0 hours | 9.0 hours |

---

## 🧮 Preprocessing & Normalization Protocol

Each patient window is normalized dynamically against its first 4 hours of baseline readings:

$$\mu = \frac{1}{4} \sum_{t=1}^{4} X_t, \quad \sigma = \sqrt{\frac{1}{4} \sum_{t=1}^{4} (X_t - \mu)^2} + 10^{-8}$$

$$X_{\text{norm}, t} = \frac{X_t - \mu}{\sigma}, \quad \forall t \in \{1, \dots, 8\}$$

- **Window Size:** 8 hours
- **Baseline Duration:** Hours 1–4
- **Scored Trajectory:** Hours 5–8 evaluated against baseline shift
- **Prediction Target:** Sepsis onset within a 6-hour forward horizon
