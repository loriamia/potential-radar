import json
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from scipy.stats import pearsonr

# =========================
# 文件路径
# =========================

TRENDING_FILE = "trending_data.json"
LABEL_FILE = "label_openrank.json"

REMOVED_FEATURE = "openrank_trend"

# =========================
# Step 0: 读取并按 repo 匹配
# =========================

with open(TRENDING_FILE, "r", encoding="utf-8") as f:
    trending_data = json.load(f)

with open(LABEL_FILE, "r", encoding="utf-8") as f:
    label_data = json.load(f)

feature_map = {
    item["repo"]: item["features"]
    for item in trending_data
}

label_map = {
    item["repo"]: item["y_growth"]
    for item in label_data
}

common_repos = sorted(set(feature_map) & set(label_map))

print(f"✅ 可用样本数: {len(common_repos)}")

# =========================
# 构建完整特征集
# =========================

all_feature_names = list(feature_map[common_repos[0]].keys())
reduced_feature_names = [
    f for f in all_feature_names if f != REMOVED_FEATURE
]

def build_xy(feature_names):
    X = np.array([
        [feature_map[repo][f] for f in feature_names]
        for repo in common_repos
    ])
    y = np.array([label_map[repo] for repo in common_repos])
    return X, y

# =========================
# 训练 + 输出结果
# =========================

def train_and_report(feature_names, title):
    print(f"\n{'='*60}")
    print(f"📌 {title}")
    print(f"特征数: {len(feature_names)}")
    print("-" * 60)

    X, y = build_xy(feature_names)

    scaler = StandardScaler()
    X_std = scaler.fit_transform(X)

    # 单特征相关性（仅输出）
    print("\n🔍 单特征相关性：")
    for i, fname in enumerate(feature_names):
        corr, _ = pearsonr(X_std[:, i], y)
        print(f"{fname:30s} corr={corr: .4f}")

    model = LinearRegression()
    model.fit(X_std, y)

    r2 = model.score(X_std, y)

    print(f"\n📈 R² = {r2:.4f}")
    print("\n⚖️ 权重（按绝对值排序）：")

    weights = model.coef_

    for fname, w in sorted(
        zip(feature_names, weights),
        key=lambda x: abs(x[1]),
        reverse=True
    ):
        print(f"{fname:30s} weight={w: .4f}")

    return r2, dict(zip(feature_names, weights))

# =========================
# Model A: 含 openrank_trend
# =========================

r2_full, weights_full = train_and_report(
    all_feature_names,
    "Model A: 含 openrank_trend（趋势延续模型）"
)

# =========================
# Model B: 去 openrank_trend
# =========================

r2_reduced, weights_reduced = train_and_report(
    reduced_feature_names,
    "Model B: 去 openrank_trend（潜力解释模型）"
)

# =========================
# 对比总结
# =========================

print("\n" + "="*60)
print("📊 模型对比总结")
print("="*60)

print(f"含 openrank_trend    R² = {r2_full:.4f}")
print(f"去 openrank_trend    R² = {r2_reduced:.4f}")
print(f"R² 损失             Δ = {r2_full - r2_reduced:.4f}")

print("\n🔁 权重变化（去掉 openrank_trend 后）：")
for fname in reduced_feature_names:
    w_before = weights_full.get(fname, 0.0)
    w_after = weights_reduced.get(fname, 0.0)
    print(
        f"{fname:30s} "
        f"before={w_before: .4f} "
        f"after={w_after: .4f}"
    )
