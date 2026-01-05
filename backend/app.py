from flask import Flask, request, jsonify
from flask_cors import CORS
from openrank_analysis import batch_analysis_repos
from cal_potential import cal
import traceback

app = Flask(__name__)
CORS(app)  # 解决跨域问题

# 定义需要分析的指标列表
METRICS = [
    "inactive_contributors", "contributors", "participants", "bus_factor",
    "issue_resolution_duration", "change_request_resolution_duration", 
    "activity", "issue_response_time", "change_request_response_time", "openrank"
]

# def cal(data):
#     """计算潜力值的函数"""
#     # 处理可能的除零错误和数据缺失
#     contributors_per_participant = data.get("contributors_per_participant", 0)
#     activity = data.get("activity", 0)
#     return 0.6 * activity + 0.4 * contributors_per_participant

@app.route('/analyze', methods=['POST'])
def analyze_repo():
    try:
        # 获取前端提交的仓库地址
        repo = request.json.get('repo')
        if not repo or '/' not in repo:
            return jsonify({"error": "请提供正确格式的仓库地址（owner/repo）"}), 400

        # 获取详细数据
        detailed_data = batch_analysis_repos(repo, METRICS)
        
        # 计算各参数的三个月平均值
        data = {}
        for metric in METRICS:
            data_list = detailed_data[metric]
            if data_list:
                avg = sum(data_list) / len(data_list)
                data[metric] = round(avg, 2)
            else:
                data[metric] = 0

        # 计算衍生指标
        data["contributors_per_participant"] = round(
            data['contributors'] / data['participants'] if data['participants'] != 0 else 0, 
            2
        )
        
        # 计算潜力值
        potential = round(cal(data), 2)
        
        # 返回结果给前端
        return jsonify({
            "repo": repo,
            "detailed_data": detailed_data,  # 原始详细数据
            "averaged_data": data,           # 平均值数据
            "potential": potential           # 计算得到的潜力值
        })
        
    except Exception as e:
        return jsonify({
            "error": f"分析失败: {str(e)}",
            "trace": traceback.format_exc()
        }), 500

if __name__ == "__main__":
    app.run(debug=True)