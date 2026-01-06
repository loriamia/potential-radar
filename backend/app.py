from flask import Flask, request, jsonify
from flask_cors import CORS
from cal_potential import compute_repo_potential
import qwen_api

app = Flask(__name__)

# ✅ 允许所有来源（开发阶段最省事）
CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=False
)

@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze():
    # ✅ 显式处理预检请求（有些浏览器/代理很严格）
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json(force=True)
        repo = data.get("repo", "").strip()

        if not repo or "/" not in repo:
            return jsonify({"error": "Invalid repo format. Use owner/repo"}), 400

        # === 调用数据处理逻辑 ===
        detailed_data, averaged_data, potential = compute_repo_potential(repo)

        return jsonify({
            "repo": repo,
            "potential": round(float(potential), 4),
            "averaged_data": averaged_data,   # ✅ 前端使用这个名字
            "detailed_data": detailed_data
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500


# 【可选】新增一个调用千问模型的接口（不影响原有/analyze接口）
@app.route("/ai-suggest", methods=["POST", "OPTIONS"])
def qwen_analyze():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json(force=True)
        repo = data.get("repo", "").strip()
        if not repo or "/" not in repo:
            return jsonify({"error": "Invalid repo format. Use owner/repo"}), 400
        # 同时保留原有潜力计算逻辑（可选）
        detailed_data, averaged_data, potential = compute_repo_potential(repo)

        # 调用千问模型分析仓库
        prompt = f"""
        请你作为一名资深开源仓库分析专家，基于以下提供的完整数据，对开源仓库「{repo}」进行全面评价，并给出切实可行的优化建议。

        ### 基础信息
        开源仓库名称：{repo}
        仓库潜力评分：{potential}（评分越高代表发展潜力越强，模型公式PotentialScore =0.67 * activity_trend- 
            0.23 * participants_trend+ 0.18 * bus_factor_jump+ 0.14 * issue_response_time_trend+ 0.2  * openrank_trend，这个公式经过建模认证，是核心）

        ### 核心数据
        1.  详细数据（detailed_data）：{detailed_data}
        2.  趋势指标数据（trending_data）：{averaged_data}

        ### 分析要求
        1.  数据解读：先简要解读潜力评分的含义，结合详细数据和平均数据，指出该仓库的核心优势（如社区活跃度高、维护频率稳定等）和核心短板（如提交量偏低、参与者较少等）。
        2.  全面评价：从3个核心维度进行评价（无需额外扩展）：
        - 社区活跃度：基于数据判断仓库的社区参与度、用户粘性是否达标；
        - 项目维护性：分析仓库的更新频率、bug修复效率、代码质量是否有保障；
        - 发展潜力：结合潜力评分和数据趋势，判断仓库未来的发展前景（如高潜力/中等潜力/低潜力，说明依据）。
        3.  优化建议：针对上述分析的短板，给出至少3条可落地、针对性强的具体建议（避免空泛表述，如“提升活跃度”需细化为具体操作）。
        4.  输出格式：分板块清晰呈现（标题+内容），语言简洁专业，200字左右，符合技术人员阅读习惯，无需冗余客套话。
        """
        qwen_response = qwen_api.call_qwen_model(prompt)
      
        return jsonify({
            "suggestion": qwen_response,
        })

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
