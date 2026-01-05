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

# =========================
# Step 0: 读取并按 repo 匹配
# =========================

with open(TRENDING_FILE, "r", encoding="utf-8") as f:
    trending_data = json.load(f)

with open(LABEL_FILE, "r", encoding="utf-8") as f:
    label_data = json.load(f)

# repo -> features
feature_map = {
    item["repo"]: item["features"]
    for item in trending_data
}

# repo -> y
label_map = {
    item["repo"]: item["y_growth"]
    for item in label_data
}

# 只保留同时存在 X 和 y 的 repo
common_repos = sorted(set(feature_map) & set(label_map))

print(f"✅ 可用样本数: {len(common_repos)}")

if len(common_repos) < 5:
    print("⚠️ 样本过少，结果不具统计意义")

# 构建 X, y
feature_names = list(feature_map[common_repos[0]].keys())

X = np.array([
    [feature_map[repo][fname] for fname in feature_names]
    for repo in common_repos
])

y = np.array([label_map[repo] for repo in common_repos])

# =========================
# Stage 1: 特征标准化
# =========================

scaler = StandardScaler()
X_std = scaler.fit_transform(X)

print("\n📌 Stage 1: 特征标准化完成")
for i, fname in enumerate(feature_names):
    print(f"{fname:30s} mean={scaler.mean_[i]: .4f}, std={np.sqrt(scaler.var_[i]): .4f}")

# =========================
# Stage 2: 单特征有效性筛查
# =========================

print("\n📌 Stage 2: 单特征与 y 的相关性")

feature_scores = []

for i, fname in enumerate(feature_names):
    xi = X_std[:, i]
    corr, p_value = pearsonr(xi, y)
    feature_scores.append((fname, corr, p_value))

    print(
        f"{fname:30s} "
        f"corr={corr: .4f} "
        f"p={p_value: .4e}"
    )

# 你可以根据 corr / p-value 自己决定是否剔除特征
# 这里不自动删除，保持可解释性

# =========================
# Stage 3: 多特征线性建模
# =========================

model = LinearRegression()
model.fit(X_std, y)

weights = model.coef_
intercept = model.intercept_
r2 = model.score(X_std, y)

print("\n📌 Stage 3: 线性模型结果（标准化特征）")

print(f"R² = {r2:.4f}")
print(f"Intercept = {intercept:.4f}\n")

for fname, w in sorted(
    zip(feature_names, weights),
    key=lambda x: abs(x[1]),
    reverse=True
):
    print(f"{fname:30s} weight = {w: .4f}")
