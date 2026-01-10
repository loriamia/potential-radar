import json
import ssl
import gzip
import urllib.request
from typing import Dict

# ======================
# 基本配置
# ======================

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; OpenDigger-Analyzer/1.0)"
}

REQUEST_TIMEOUT = 15
END_MONTH = "2025-6"

METRICS = [
    "contributors",
    "participants",
    "bus_factor",
    "activity",
    "issue_response_time",
    "openrank"   # ★ openrank 是核心，缺失直接丢弃仓库
]

# ======================
# Step 1: 获取月度时间序列
# ======================

def get_repo_metric_timeseries(repo_full_name: str, metric: str) -> Dict[str, float]:
    owner, repo = repo_full_name.split('/')
    url = f"https://oss.open-digger.cn/github/{owner}/{repo}/{metric}.json"

    ssl_context = ssl._create_unverified_context()

    try:
        request = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(
            request,
            context=ssl_context,
            timeout=REQUEST_TIMEOUT
        ) as response:

            raw = response.read()
            if response.headers.get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)

            data = json.loads(raw.decode("utf-8"))

            if not isinstance(data, dict):
                return {}

            time_data = data.get("avg", data)
            if not isinstance(time_data, dict):
                return {}

            return {
                k: v for k, v in time_data.items()
                if isinstance(k, str) and len(k) == 7 and "-" in k
            }

    except Exception as e:
        print(f"❌ 获取失败: {repo_full_name} / {metric} / {e}")
        return {}

# ======================
# Step 2: 截取最近 N 个月
# ======================

def slice_last_n_months(timeseries: Dict[str, float], end_month: str, n=3):
    months = sorted([m for m in timeseries.keys() if m <= end_month])
    selected = months[-n:]
    return {m: timeseries[m] for m in selected}

# ======================
# Step 3: 计算趋势 / 跃迁指标
# ======================

def compute_trending_features(monthly_metrics: Dict[str, Dict[str, float]]):
    def delta_percent(values):
        if len(values) < 2:
            return 0.0
        start, end = values[0], values[-1]
        if start == 0:
            return 0.0
        return round((end - start) / abs(start), 4)

    def jump(values, threshold=1):
        if len(values) < 2:
            return 0
        return int(values[0] <= threshold and values[-1] > threshold)

    trending = {}

    trending["activity_trend"] = delta_percent(
        list(monthly_metrics["activity"].values())
    )

    trending["participants_trend"] = delta_percent(
        list(monthly_metrics["participants"].values())
    )

    trending["openrank_trend"] = delta_percent(
        list(monthly_metrics["openrank"].values())
    )

    trending["contributors_jump"] = jump(
        list(monthly_metrics["contributors"].values()), threshold=1
    )

    trending["bus_factor_jump"] = jump(
        list(monthly_metrics["bus_factor"].values()), threshold=1
    )

    trending["issue_response_time_trend"] = -delta_percent(
        list(monthly_metrics["issue_response_time"].values())
    )

    return trending

# ======================
# Step 4: 主流程
# ======================

def main():
    with open("repos_snapshot.json", "r", encoding="utf-8") as f:
        repos = json.load(f)

    all_raw_data = []
    all_trending_data = []

    for repo in repos:
        # print("\n" + "=" * 60)
        # print(f"📦 Processing repo: {repo}")

        repo_raw_metrics = {}
        discard_repo = False

        # ---- 拉取所有指标 ----
        for metric in METRICS:
            ts = get_repo_metric_timeseries(repo, metric)

            if not ts:
                discard_repo = True
                break

            ts_3m = slice_last_n_months(ts, END_MONTH, n=6)

            # 最近三个月数据不足，也丢弃
            if len(ts_3m) < 2:
                discard_repo = True
                break

            repo_raw_metrics[metric] = ts_3m

        # ---- 丢弃不完整仓库 ----
        if discard_repo:
        #     print(f"⚠️ 丢弃仓库（指标不完整）: {repo}")
            continue

        # ---- 计算趋势特征 ----
        trending_features = compute_trending_features(repo_raw_metrics)

        # ---- 统一存储 ----
        all_raw_data.append({
            "repo": repo,
            "metrics": repo_raw_metrics
        })

        all_trending_data.append({
            "repo": repo,
            "features": trending_features
        })

        print("✅ 成功处理")
        print("🔸 Trending features:")
        print(json.dumps(trending_features, indent=2, ensure_ascii=False))

    # ======================
    # 最终结果（内存中）
    # ======================

    print("\n" + "=" * 60)
    print(f"🎯 完成，共保留 {len(all_raw_data)} 个有效仓库")

    # 如需后续使用，可直接 dump
    with open("raw_data.json", "w", encoding="utf-8") as f:
        json.dump(all_raw_data, f, indent=2, ensure_ascii=False)

    with open("trending_data.json", "w", encoding="utf-8") as f:
        json.dump(all_trending_data, f, indent=2, ensure_ascii=False)

    print("💾 数据已保存：raw_data.json / trending_data.json")


if __name__ == "__main__":
    main()
