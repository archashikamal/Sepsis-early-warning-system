# Contributing to Sepsis Early-Warning System

Thank you for your interest in contributing! We welcome contributions to improve the model architecture, API resilience, and clinical dashboard.

---

## 📋 Development Workflow

1. **Fork the repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/sepsis-early-warning-system.git
   cd sepsis-early-warning-system
   ```
3. **Create a feature branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```
4. **Make your changes**:
   - Ensure backend changes adhere to PEP8 guidelines and pass type checks.
   - Ensure frontend changes conform to existing React modular components and ESLint rules.
5. **Test locally**:
   - Verify backend runs: `uvicorn main:app --port 8000`
   - Verify frontend builds: `npm run build` inside `frontend/`
6. **Commit and push**:
   ```bash
   git commit -m "feat: describe your change"
   git push origin feature/my-new-feature
   ```
7. **Open a Pull Request** against the `main` branch.

---

## ⚠️ Important Note on Clinical Code
All modifications to physiological bounds, scoring thresholds, or model weights must be documented with relevant clinical or statistical rationale.
