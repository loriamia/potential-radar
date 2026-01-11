# potential-radar
**作品名称:github开源项目潜力智能评估系统**  

**组长：陈宁致  负责数据收集与建模、AI的接入与调用**   
负责数据层与算法层研发：主导开源项目相关数据的采集、清洗与结构化处理；搭建项目潜力评估模型；完成大模型接口的对接与功能集成，实现评估逻辑的智能化落地。

**组员：区慧雅  负责指标可视化设计、页面UI设计**  
负责前端交互与视觉设计：承担页面 UI 的原型设计与视觉风格定义；负责数据可视化方案的选型与开发，实现评估结果的直观呈现；保障前端页面的交互体验与美观性。

## 一、作品简介
基于opendigger指标和线性回归的github仓库潜力评估模型，结合AI评价和建议生成和可视化报告。

项目结构：
```
./backend/ : 后端代码
./frontend/ : 前端代码
./modeling/ ：建模相关代码
```
## 二、快速开始
将仓库克隆到本地。安装依赖
```
pip install flask, lask_cors, openai
```
进入backend文件夹,运行后端文件启动服务器。
```
cd ./backend
python app.py
```
用浏览器打开`frontend/index.html`即可。
![alt text](./img/image.png)
## 三、功能介绍
用户输入github仓库地址，便能生成潜力值评估报告：
![alt text](./img/image-4.png)

可视化报告
- 活跃度和潜力值的复合图像
- 贡献者和参与者的趋势折线图
- 六维度趋势雷达图
- 潜力值仪表盘

![alt text](./img/image-2.png)

ai生成评价和建议（接入qwen-turbo模型）
![alt text](./img/image-3.png)

## 四、技术栈
1. **开发语言**：Python 3.9、JavaScript
2. **核心框架/库**：
   - Flask（Python Web框架）
   - ECharts 5.x（数据可视化）
   - Requests（Python网络请求）、Urllib（Python网络请求）
   - Marked.js/Showdown.js（网页Markdown渲染）
3. **数据工具/接口**：
   - OpenDigger（开源数据分析工具）
   - GitHub API（开放数据接口）
   - Qwen-turbo API（大模型服务接口）

