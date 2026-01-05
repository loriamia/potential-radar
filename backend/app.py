from flask import Flask, request, jsonify
from flask_cors import CORS
from cal_potential import compute_repo_potential

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


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
