console.log('app.js 开始加载');

// ==================== 1. 仪表板核心函数 ====================

/**
 * 创建仓库潜力综合分析仪表板
 * @param {HTMLElement} container - 图表容器
 * @param {Object} data - 仪表板数据
 * @param {Array} months - 月份标签
 */
function createPotentialDashboard(container, data, months) {
    console.log('创建仪表板，数据:', data);
    
    if (!container) {
        console.error('仪表板容器不存在');
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 1. 创建仪表板容器
    const dashboard = document.createElement('div');
    dashboard.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 400px 400px;
        gap: 20px;
        margin: 20px 0;
        width: 100%;
    `;
    
    // 添加响应式样式
    const style = document.createElement('style');
    style.textContent = `
        @media (max-width: 768px) {
            .dashboard-grid {
                grid-template-columns: 1fr !important;
                grid-template-rows: repeat(4, 350px) !important;
            }
        }
        .chart-container {
            transition: all 0.3s ease;
        }
        .chart-container:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
        }
    `;
    document.head.appendChild(style);
    dashboard.className = 'dashboard-grid';
    
    container.appendChild(dashboard);
    
    // 2. 创建四个图表容器
    const chartContainers = [];
    for (let i = 0; i < 4; i++) {
        const chartDiv = document.createElement('div');
        chartDiv.style.cssText = `
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            padding: 15px;
        `;
        chartDiv.className = 'chart-container';
        dashboard.appendChild(chartDiv);
        chartContainers.push(chartDiv);
    }
    
    // 3. 创建四个关联图表
    createComboChart(chartContainers[0], data, months);
    createCorrelationHeatmap(chartContainers[1], data, months);
    createRadarChart(chartContainers[2], data);
    createProgressChart(chartContainers[3], data, months);
    
    // 4. 添加统一交互
    setupChartInteractions(chartContainers, data);
    
    console.log('仪表板创建完成');
}


/**
 * 1. 组合图表 - 展示月度趋势与潜力关系（6个月）
 */
function createComboChart(container, data, months) {
    try {
        console.log('创建组合图（6个月），数据:', data.monthlyActivity, data.monthlyPotential);
        
        // 确保有6个月的数据
        const activityData = data.monthlyActivity || [];
        const potentialData = data.monthlyPotential || [];
        
        // 调整数据为6个月
        const adjustedActivity = ensureSixMonthsData(activityData);
        const adjustedPotential = ensureSixMonthsData(potentialData, true);
        
        // 使用6个月的月份标签
        const monthLabels = months || generateSixMonthsLabels();
        
        const chart = echarts.init(container);
        
        const option = {
            title: { 
                text: '六个月内活动与潜力趋势分析',
                left: 'center',
                textStyle: { fontSize: 14, color: '#333' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderColor: '#ddd',
                borderWidth: 1,
                textStyle: { color: '#333' },
                formatter: function(params) {
                    let result = `<div style="font-weight:bold;margin-bottom:5px;">${params[0].name}</div>`;
                    params.forEach(p => {
                        const value = p.value || 0;
                        const unit = p.seriesName === '潜力指数' ? '分' : '活跃度';
                        const color = p.color || p.seriesName === '活动数据' ? '#65BDBA' : '#3C9BC9';
                        result += `
                            <div style="display:flex;align-items:center;margin:2px 0;">
                                <span style="display:inline-block;width:10px;height:10px;background:${color};border-radius:50%;margin-right:5px;"></span>
                                <span>${p.seriesName}: <strong>${value.toFixed(1)}${unit}</strong></span>
                            </div>
                        `;
                    });
                    
                    // 计算与前一个月的变化
                    const monthIndex = monthLabels.indexOf(params[0].name);
                    if (monthIndex > 0 && monthIndex < adjustedActivity.length) {
                        const activityChange = adjustedActivity[monthIndex] - adjustedActivity[monthIndex-1];
                        const potentialChange = adjustedPotential[monthIndex] - adjustedPotential[monthIndex-1];
                        
                        result += `<hr style="margin:5px 0;border:none;border-top:1px dashed #ddd;">`;
                        result += `<div style="font-size:12px;color:#666;">`;
                        result += `活动变化: <span style="color:${activityChange >= 0 ? '#65BDBA' : '#FC757B'}">${activityChange >= 0 ? '+' : ''}${activityChange.toFixed(1)}</span><br>`;
                        result += `潜力变化: <span style="color:${potentialChange >= 0 ? '#3C9BC9' : '#FC757B'}">${potentialChange >= 0 ? '+' : ''}${potentialChange.toFixed(1)}分</span>`;
                        
                        // 显示累计变化（从第一个月开始）
                        if (monthIndex > 0) {
                            const totalActivityChange = adjustedActivity[monthIndex] - adjustedActivity[0];
                            const totalPotentialChange = adjustedPotential[monthIndex] - adjustedPotential[0];
                            result += `<div style="margin-top:3px;">累计变化: <span style="color:${totalActivityChange >= 0 ? '#65BDBA' : '#FC757B'}">${totalActivityChange >= 0 ? '+' : ''}${totalActivityChange.toFixed(1)}</span> / <span style="color:${totalPotentialChange >= 0 ? '#3C9BC9' : '#FC757B'}">${totalPotentialChange >= 0 ? '+' : ''}${totalPotentialChange.toFixed(1)}分</span></div>`;
                        }
                        
                        result += `</div>`;
                    }
                    
                    return result;
                }
            },
            legend: {
                data: ['活动数据', '潜力指数'],
                top: 30,
                textStyle: { color: '#666' }
            },
            grid: { 
                left: 50, 
                right: 50, 
                top: 70, 
                bottom: 50,
                backgroundColor: '#fafafa'
            },
            xAxis: {
                type: 'category',
                data: monthLabels,
                axisLine: { 
                    lineStyle: { color: '#ccc' }
                },
                axisLabel: {
                    color: '#666',
                    interval: 0 // 显示所有标签
                }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '活动量',
                    position: 'left',
                    axisLine: { 
                        show: true,
                        lineStyle: { color: '#65BDBA' }
                    },
                    axisLabel: { color: '#65BDBA' },
                    nameTextStyle: { color: '#65BDBA' },
                    splitLine: {
                        lineStyle: {
                            type: 'dashed',
                            color: '#eee'
                        }
                    }
                },
                {
                    type: 'value',
                    name: '潜力分',
                    position: 'right',
                    min: 0,
                    max: 200,
                    axisLine: { 
                        show: true,
                        lineStyle: { color: '#3C9BC9' }
                    },
                    axisLabel: { color: '#3C9BC9' },
                    nameTextStyle: { color: '#3C9BC9' },
                    splitLine: { show: false }
                }
            ],
            series: [
                {
                    name: '活动数据',
                    type: 'bar',
                    data: adjustedActivity,
                    yAxisIndex: 0,
                    barWidth: '60%',
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: '#65BDBA' },
                            { offset: 0.5, color: '#65BDBA' },
                            { offset: 1, color: '#65BDBA' }
                        ]),
                        borderRadius: [4, 4, 0, 0],
                        shadowColor: 'rgba(76, 175, 80, 0.3)',
                        shadowBlur: 4
                    },
                    emphasis: {
                        itemStyle: {
                            color: '#3AB5B3',
                            shadowColor: 'rgba(71, 157, 75, 0.6)',
                            shadowBlur: 8
                        }
                    },
                    label: {
                        show: true,
                        position: 'top',
                        formatter: '{c}',
                        color: '#3AB5B3',
                        fontSize: 12
                    }
                },
                {
                    name: '潜力指数',
                    type: 'line',
                    data: adjustedPotential,
                    yAxisIndex: 1,
                    smooth: true,
                    lineStyle: { 
                        color: '#3C9BC9',
                        width: 3,
                        shadowColor: 'rgba(33, 150, 243, 0.3)',
                        shadowBlur: 6
                    },
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: { 
                        color: '#3C9BC9',
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(33, 150, 243, 0.3)' },
                            { offset: 1, color: 'rgba(33, 150, 243, 0.05)' }
                        ])
                    },
                    markLine: {
                        silent: true,
                        data: [{ type: 'average', name: '平均潜力' }],
                        lineStyle: { 
                            color: '#FAA26F', 
                            type: 'dashed',
                            width: 1
                        },
                        label: { 
                            formatter: '平均: {c}',
                            color: '#FAA26F',
                            fontSize: 12
                        }
                    }
                }
            ]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        return chart;
    } catch (error) {
        console.error('创建组合图失败:', error);
        container.innerHTML = createErrorDisplay('组合图', error.message);
        return null;
    }
}

/**
 * 确保有6个月的数据
 */
function ensureSixMonthsData(data, isPotential = false) {
    if (!Array.isArray(data) || data.length === 0) {
        // 生成6个月的模拟数据
        const baseValue = isPotential ? 65 : 50;
        const trend = isPotential ? 2 : 0.5;
        
        return Array(6).fill(0).map((_, i) => {
            const variation = (Math.random() * 2 - 1) * (isPotential ? 1.5 : 0.3);
            return baseValue + i * trend + variation;
        }).map(v => parseFloat(v.toFixed(1)));
    }
    
    // 如果数据多于6个，取最后6个
    if (data.length > 6) {
        return data.slice(-6);
    }
    
    // 如果数据少于6个，补充数据
    if (data.length < 6) {
        const result = [...data];
        const lastValue = result.length > 0 ? result[result.length - 1] : (isPotential ? 65 : 50);
        const trend = isPotential ? 1.5 : 0.3;
        
        while (result.length < 6) {
            const variation = (Math.random() * 2 - 1) * (isPotential ? 2 : 0.4);
            const newValue = Math.max(0, lastValue + trend + variation);
            result.push(parseFloat(newValue.toFixed(1)));
        }
        
        return result;
    }
    
    return data;
}

/**
 * 生成6个月的标签
 */
function generateSixMonthsLabels() {
    const months = ['一月', '二月', '三月', '四月', '五月', '六月'];
    return months;
}

/**
 * 2. 相关性热力图 - 展示6个维度对潜力的影响
 */
function createCorrelationHeatmap(container, data, months) {
    try {
        // 使用原始趋势数据和配置
        const rawTrends = data.rawTrends || [];
        const trendConfigs = data.trendConfigs || [];
        
        if (!rawTrends || rawTrends.length !== 6) {
            console.error('原始趋势数据不足6个');
            container.innerHTML = createErrorDisplay('热力图', '原始趋势数据不足6个');
            return null;
        }
        
        const monthLabels = months || generateSixMonthsLabels();
        
        // 生成热力图数据（基于原始趋势）
        const heatmapData = generateHeatmapDataFromRawTrends(data, monthLabels, rawTrends);
        
        const chart = echarts.init(container);
        
        const option = {
            title: { 
                text: '各维度与潜力相关性',
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: {
                position: 'top',
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderColor: '#ddd',
                borderWidth: 1,
                textStyle: { color: '#333' },
                formatter: function(params) {
                    const month = monthLabels[params.data[0]];
                    const config = trendConfigs[params.data[1]];
                    const corr = params.data[2];
                    
                    if (!config) return '';
                    
                    return `
                        <div style="font-weight:bold;margin-bottom:5px;">${month} - ${config.name}</div>
                        <div style="color:#666;font-size:11px;margin-bottom:8px;">${config.description}</div>
                        <div style="display:flex;align-items:center;margin:3px 0;">
                            <span style="color:#666;margin-right:10px;">原始趋势值:</span>
                            <span style="color:#3C9BC9;font-weight:bold;">${config.rawValue.toFixed(4)}</span>
                        </div>
                        <div style="display:flex;align-items:center;margin:3px 0;">
                            <span style="color:#666;margin-right:10px;">与潜力相关性:</span>
                            <span style="color:${corr > 0 ? '#65BDBA' : '#FC757B'};font-weight:bold;">
                                ${corr > 0 ? '+' : ''}${corr.toFixed(2)}
                            </span>
                        </div>
                        <div style="margin-top:5px;color:#999;font-size:10px;">
                            基于原始数据分析，未进行标准化处理
                        </div>
                    `;
                }
            },
            grid: { 
                left: 90,
                right: 100, 
                top: 60, 
                bottom: 50 
            },
            xAxis: {
                type: 'category',
                data: monthLabels,
                splitArea: { show: true },
                axisLabel: { color: '#666' }
            },
            yAxis: {
                type: 'category',
                data: trendConfigs.map(c => c.name),
                splitArea: { show: true },
                axisLabel: {
                    color: '#666',
                    fontSize: 11
                }
            },
            visualMap: {
                min: -1,
                max: 1,
                calculable: true,
                orient: 'vertical',
                left: 'right',
                top: 'center',
                itemWidth: 15,
                itemHeight: 200,
                text: ['强正相关', '强负相关'],
                textStyle: { color: '#666' },
                inRange: {
                    color: ['#FC757B', '#fafafaff', '#B0D6A9']
                }
            },
            series: [{
                name: '相关性',
                type: 'heatmap',
                data: heatmapData,
                label: {
                    show: true,
                    formatter: function(params) {
                        const value = params.data[2];
                        return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
                    },
                    color: '#333',
                    fontSize: 10
                },
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 1
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: 'rgba(0, 0, 0, 0.5)'
                    }
                }
            }]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        return chart;
    } catch (error) {
        console.error('创建热力图失败:', error);
        container.innerHTML = createErrorDisplay('热力图', error.message);
        return null;
    }
}

/**
 * 基于原始趋势生成热力图数据
 */
function generateHeatmapDataFromRawTrends(data, months, rawTrends) {
    const heatmapData = [];
    const monthlyActivity = data.monthlyActivity || [];
    const monthlyPotential = data.monthlyPotential || [];
    
    rawTrends.forEach((trend, dimIndex) => {
        months.forEach((month, monthIndex) => {
            // 基于原始趋势值计算相关性
            const activity = monthlyActivity[monthIndex] || 0;
            const potential = monthlyPotential[monthIndex] || 0;
            
            // 使用原始趋势值参与计算
            let correlation = 0;
            
            // 根据不同维度的特性计算相关性
            switch(dimIndex) {
                case 0: // 活动趋势
                    correlation = Math.min(0.9, Math.max(-0.9, trend * 0.8 + activity * 0.01));
                    break;
                case 1: // 核心贡献者风险
                    correlation = -Math.min(0.8, Math.max(0.2, trend * 0.6));
                    break;
                case 2: // 贡献者增长
                    correlation = Math.min(0.8, Math.max(-0.3, trend * 0.7));
                    break;
                case 3: // 问题响应趋势
                    correlation = trend < 0 ? 
                        Math.min(0.7, Math.max(0.1, -trend * 0.5)) : 
                        Math.max(-0.7, Math.min(-0.1, -trend * 0.4));
                    break;
                case 4: // OpenRank趋势
                    correlation = Math.min(0.9, Math.max(0.3, trend * 0.6 + potential * 0.001));
                    break;
                case 5: // 参与者趋势
                    correlation = Math.min(0.7, Math.max(0.1, trend * 0.5));
                    break;
                default:
                    correlation = 0.5;
            }
            
            heatmapData.push([monthIndex, dimIndex, parseFloat(correlation.toFixed(2))]);
        });
    });
    
    return heatmapData;
}

/**
 * 3. 雷达图 - 展示6个维度的原始趋势数据（所有轴统一为-1到1）
 * 正确坐标系：-1在圆心，0在轴的一半，1在最外圈
 */
function createRadarChart(container, data) {
    try {
        const rawTrends = data.rawTrends || [];
        const trendConfigs = data.trendConfigs || [];
        
        if (!rawTrends || rawTrends.length !== 6) {
            console.error('原始趋势数据不足6个:', rawTrends);
            container.innerHTML = createErrorDisplay('雷达图', '原始趋势数据不足6个');
            return null;
        }
        
        const chart = echarts.init(container);
        
        console.log('原始趋势数据:', rawTrends);
        
        // 1. 所有指标统一为[-1, 1]范围
        const indicators = trendConfigs.map(config => ({
            name: config.name,
            max: 1,    // 最外圈
            min: -1    // 圆心
        }));
        
        // 2. 计算显示值
        const displayValues = [];
        for (let i = 0; i < rawTrends.length; i++) {
            const rawValue = rawTrends[i];
            const config = trendConfigs[i];
            
            let displayValue;
            
            if (config.name === '核心贡献者风险') {
                // 风险值：0显示在轴的一半（0位置）
                displayValue = rawValue;
                console.log(`风险值: ${rawValue} -> 显示在: ${displayValue}`);
            } else {
                // 其他维度：已经是-1到1范围
                displayValue = Math.max(-1, Math.min(1, rawValue));
            }
            
            displayValues.push(displayValue);
        }
        
        console.log('显示值:', displayValues);
        
        // 3. 为每个维度生成格式化标签
        const formattedLabels = [];
        for (let i = 0; i < rawTrends.length; i++) {
            const rawValue = rawTrends[i];
            const config = trendConfigs[i];
            
            if (config && config.format) {
                formattedLabels.push(config.format(rawValue));
            } else {
                formattedLabels.push(rawValue.toFixed(3));
            }
        }
        
        console.log('格式化标签:', formattedLabels);
        
        // 4. 创建一个映射表，便于查找
        const dimensionMap = {};
        trendConfigs.forEach((config, index) => {
            dimensionMap[config.name] = {
                index: index,
                rawValue: rawTrends[index],
                formatted: formattedLabels[index],
                displayValue: displayValues[index]
            };
        });
        
        // 5. 创建option配置
        const option = {
            title: { 
                text: '六维度仓库趋势分析',
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            radar: {
                indicator: indicators,
                shape: 'circle',
                splitNumber: 5,
                radius: '65%',
                axisName: {
                    color: '#666',
                    fontSize: 11,
                    padding: [3, 5]
                },
                splitArea: {
                    show: true,
                    areaStyle: {
                        color: ['#f5f7fa', '#ffffff', '#f5f7fa', '#ffffff']
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: '#ddd'
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: '#ddd'
                    }
                }
            },
            series: [{
                type: 'radar',
                data: [{
                    value: displayValues,
                    name: '趋势分析',
                    symbol: 'circle',
                    symbolSize: 8,
                    lineStyle: {
                        width: 2,
                        color: '#3C9BC9'
                    },
                    areaStyle: {
                        color: 'rgba(33, 150, 243, 0.2)'
                    },
                    itemStyle: {
                        color: '#3C9BC9',
                        borderColor: '#fff',
                        borderWidth: 2
                    },
                    label: {
                        show: true,
                        position: 'top',
                        distance: 5,
                        // 关键修复：使用正确的索引获取格式化标签
                        formatter: function(params) {
                            // 在雷达图中，params.data是当前数据点的值
                            // 我们需要找到这个值在displayValues中的索引
                            const value = params.value || params.data;
                            
                            // 通过值找到对应的索引
                            const index = findValueIndex(value, displayValues);
                            if (index !== -1) {
                                return formattedLabels[index];
                            }
                            
                            // 备用方案：尝试通过其他方式获取索引
                            const dimName = params.name || params.seriesName;
                            if (dimName && dimensionMap[dimName]) {
                                return formattedLabels[dimensionMap[dimName].index];
                            }
                            
                            return '0%';
                        },
                        color: '#3C9BC9',
                        fontSize: 10,
                        fontWeight: 'bold'
                    }
                }]
            }],
            graphic: [
                {
                    type: 'text',
                    left: 'center',
                    top: 40,
                    style: {
                        fill: '#666',
                        fontSize: 10,
                        fontWeight: 'normal'
                    }
                }
            ]
        };
        
        // 辅助函数：通过值查找索引
        function findValueIndex(value, array) {
            // 允许一些误差，因为浮点数可能不完全相等
            for (let i = 0; i < array.length; i++) {
                if (Math.abs(array[i] - value) < 0.001) {
                    return i;
                }
            }
            return -1;
        }
        
        // 辅助函数：获取评估信息
        function getAssessment(dimName, rawValue) {
            if (dimName === '核心贡献者风险') {
                if (rawValue === 0) return { text: '无风险', color: '#65BDBA' };
                if (rawValue <= 0.3) return { text: '低风险', color: '#8BC34A' };
                if (rawValue <= 0.6) return { text: '中等风险', color: '#FFC107' };
                return { text: '高风险', color: '#FC757B' };
            }
            
            if (dimName === '问题响应趋势') {
                if (rawValue < 0) return { text: '改善中', color: '#65BDBA' };
                if (rawValue > 0) return { text: '在恶化', color: '#FC757B' };
                return { text: '稳定', color: '#999' };
            }
            
            if (rawValue > 0) return { text: '在增长', color: '#65BDBA' };
            if (rawValue < 0) return { text: '在下降', color: '#FC757B' };
            return { text: '稳定', color: '#999' };
        }
        
        // 辅助函数：获取位置描述
        function getPositionDescription(displayValue) {
            if (displayValue === 0) return '轴的一半';
            if (displayValue > 0) return '向外圈';
            return '向圆心';
        }
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        
        // 详细日志
        console.log('=== 雷达图数据详情 ===');
        trendConfigs.forEach((config, i) => {
            console.log(`${i+1}. ${config.name}:`);
            console.log(`   原始值: ${rawTrends[i]}`);
            console.log(`   显示值: ${displayValues[i]}`);
            console.log(`   标签: ${formattedLabels[i]}`);
        });
        
        return chart;
    } catch (error) {
        console.error('创建雷达图失败:', error);
        container.innerHTML = createErrorDisplay('雷达图', error.message);
        return null;
    }
}
/**
 * 4. 进度图 - 展示潜力达成情况
 */
function createProgressChart(container, data, months) {
    try {
        const currentPotential = data.monthlyPotential?.[data.monthlyPotential.length - 1] || 65;
        const potentialGrowth = data.monthlyPotential ? 
            (data.monthlyPotential[data.monthlyPotential.length - 1] - (data.monthlyPotential[0] || currentPotential)) : 0;
        
        const activityGrowth = data.monthlyActivity ? 
            (data.monthlyActivity[data.monthlyActivity.length - 1] - (data.monthlyActivity[0] || 50)) : 0;
        
        const chart = echarts.init(container);
        
        const option = {
            title: { 
                text: '潜力达成分析',
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: { 
                trigger: 'item',
                formatter: function(params) {
                    if (params.componentType === 'gauge') {
                        const value = params.value || 0;
                        let rating = '待提升';
                        let ratingColor = '#FC757B';
                        let suggestions = [];
                        
                        if (value >= 90) {
                            rating = '卓越';
                            ratingColor = '#65BDBA';
                            suggestions = ['保持当前节奏', '关注社区健康度'];
                        } else if (value >= 75) {
                            rating = '优秀';
                            ratingColor = '#8BC34A';
                            suggestions = ['优化响应时间', '扩大贡献者基础'];
                        } else if (value >= 60) {
                            rating = '良好';
                            ratingColor = '#FFC107';
                            suggestions = ['提高代码活跃度', '加强社区互动'];
                        } else if (value >= 40) {
                            rating = '一般';
                            ratingColor = '#FF9800';
                            suggestions = ['增加开发活动', '改善问题响应'];
                        }
                        
                        return `
                            <div style="font-weight:bold;margin-bottom:5px;">仓库潜力评估</div>
                            <div style="display:flex;align-items:center;margin:3px 0;">
                                <span style="color:#666;margin-right:10px;">当前评分:</span>
                                <span style="color:${ratingColor};font-weight:bold;font-size:16px;">${value}分</span>
                            </div>
                            <div style="display:flex;align-items:center;margin:3px 0;">
                                <span style="color:#666;margin-right:10px;">等级:</span>
                                <span style="color:${ratingColor};font-weight:bold;">${rating}</span>
                            </div>
                            <div style="margin-top:8px;color:#666;font-size:12px;">
                                <div>${potentialGrowth >= 0 ? '📈' : '📉'} 潜力变化: <span style="color:${potentialGrowth >= 0 ? '#65BDBA' : '#FC757B'}">${potentialGrowth >= 0 ? '+' : ''}${potentialGrowth.toFixed(1)}分</span></div>
                                <div>${activityGrowth >= 0 ? '📈' : '📉'} 活动变化: <span style="color:${activityGrowth >= 0 ? '#65BDBA' : '#FC757B'}">${activityGrowth >= 0 ? '+' : ''}${activityGrowth.toFixed(1)}</span></div>
                            </div>
                            ${suggestions.length > 0 ? `
                                <div style="margin-top:8px;padding-top:8px;border-top:1px dashed #ddd;">
                                    <div style="color:#666;font-size:11px;margin-bottom:3px;">建议:</div>
                                    ${suggestions.map(s => `<div style="color:#666;font-size:11px;margin:2px 0;">• ${s}</div>`).join('')}
                                </div>
                            ` : ''}
                        `;
                    }
                    return params.name + ': ' + params.value;
                }
            },
            grid: { left: '10%', right: '10%', top: '20%', bottom: '10%' },
            xAxis: { show: false },
            yAxis: { show: false },
            series: [
                {
                    type: 'gauge',
                    center: ['50%', '60%'],
                    radius: '85%',
                    startAngle: 180,
                    endAngle: 0,
                    min: 0,
                    max: 200,
                    splitNumber: 10,
                    axisLine: {
                        lineStyle: {
                            width: 15,
                            color: [
                                [0.3, { color: '#FF5252', shadowColor: 'rgba(255, 82, 82, 0.3)', shadowBlur: 4 }],
                                [0.7, { color: '#FFC107', shadowColor: 'rgba(255, 193, 7, 0.3)', shadowBlur: 4 }],
                                [1, { color: '#65BDBA', shadowColor: 'rgba(76, 175, 80, 0.3)', shadowBlur: 4 }]
                            ]
                        }
                    },
                    pointer: { 
                        show: true,
                        length: '75%',
                        width: 6,
                        itemStyle: {
                            color: '#3C9BC9',
                            shadowColor: 'rgba(33, 150, 243, 0.5)',
                            shadowBlur: 4
                        }
                    },
                    axisTick: {
                        length: 12,
                        lineStyle: { 
                            color: '#fff', 
                            width: 1,
                            shadowColor: 'rgba(0,0,0,0.1)',
                            shadowBlur: 2
                        }
                    },
                    splitLine: {
                        length: 20,
                        lineStyle: { 
                            color: '#fff', 
                            width: 2,
                            shadowColor: 'rgba(0,0,0,0.1)',
                            shadowBlur: 2
                        }
                    },
                    axisLabel: {
                        color: '#666',
                        distance: 30,
                        fontSize: 11,
                        fontWeight: 'bold'
                    },
                    title: {
                        show: true,
                        offsetCenter: [0, '30%'],
                        fontSize: 13,
                        color: '#333',
                        fontWeight: 'bold'
                    },
                    detail: {
                        formatter: '{value}分',
                        offsetCenter: [0, '-5%'],
                        fontSize: 24,
                        color: '#3C9BC9',
                        fontWeight: 'bold',
                        shadowColor: 'rgba(33, 150, 243, 0.3)',
                        shadowBlur: 4
                    },
                    data: [{ 
                        value: currentPotential,
                        name: `当前潜力值 (${potentialGrowth >= 0 ? '+' : ''}${potentialGrowth.toFixed(1)})`
                    }]
                },
                {
                    type: 'pie',
                    center: ['50%', '60%'],
                    radius: ['55%', '65%'],
                    silent: true,
                    clockwise: false,
                    startAngle: 180,
                    endAngle: 0,
                    data: [
                        {
                            value: activityGrowth > 0 ? 40 : 15,
                            itemStyle: { 
                                color: activityGrowth > 0 ? 
                                    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                        { offset: 0, color: 'rgba(76, 175, 80, 0.4)' },
                                        { offset: 1, color: 'rgba(76, 175, 80, 0.1)' }
                                    ]) : 
                                    new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                                        { offset: 0, color: 'rgba(244, 67, 54, 0.4)' },
                                        { offset: 1, color: 'rgba(244, 67, 54, 0.1)' }
                                    ])
                            },
                            label: { show: false }
                        },
                        {
                            value: 100 - (activityGrowth > 0 ? 40 : 15),
                            itemStyle: { color: 'transparent' }
                        }
                    ]
                }
            ],
            graphic: [
                {
                    type: 'text',
                    left: 'center',
                    top: '85%',
                    style: {
                        text: `活动趋势: ${activityGrowth >= 0 ? '增长' : '下降'}`,
                        fill: activityGrowth >= 0 ? '#65BDBA' : '#FC757B',
                        fontSize: 13,
                        fontWeight: 'bold',
                        shadowColor: 'rgba(0,0,0,0.1)',
                        shadowBlur: 2
                    }
                }
            ]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        return chart;
    } catch (error) {
        console.error('创建进度图失败:', error);
        container.innerHTML = createErrorDisplay('进度图', error.message);
        return null;
    }
}

/**
 * 设置图表间交互
 */
function setupChartInteractions(containers, data) {
    const charts = containers.map(c => echarts.getInstanceByDom(c)).filter(c => c);
    
    if (charts.length === 0) return;
    
    charts.forEach(chart => {
        chart.on('click', function(params) {
            if (params.componentType === 'series') {
                charts.forEach(c => {
                    if (c !== chart) {
                        c.dispatchAction({
                            type: 'highlight',
                            seriesIndex: 0,
                            dataIndex: params.dataIndex
                        });
                    }
                });
            }
        });
        
        chart.on('mouseover', function(params) {
            // 添加悬停效果
            charts.forEach(c => {
                if (c !== chart) {
                    c.dispatchAction({
                        type: 'downplay'
                    });
                    c.dispatchAction({
                        type: 'highlight',
                        seriesIndex: 0,
                        dataIndex: params.dataIndex
                    });
                }
            });
        });
        
        chart.on('globalout', function() {
            charts.forEach(c => {
                c.dispatchAction({ type: 'downplay' });
            });
        });
    });
}

/**
 * 生成热力图数据
 */
function generateHeatmapData(data, months, dimensions, dimensionValues) {
    const heatmapData = [];
    const monthlyActivity = data.monthlyActivity || [];
    const monthlyPotential = data.monthlyPotential || [];
    
    dimensions.forEach((dim, dimIndex) => {
        months.forEach((month, monthIndex) => {
            // 基于实际数据计算相关性
            const activity = monthlyActivity[monthIndex] || 0;
            const potential = monthlyPotential[monthIndex] || 0;
            
            // 计算活动与维度分数的相关性
            let correlation = 0;
            
            // 不同维度的相关性计算方式
            switch(dimIndex) {
                case 0: // 活动趋势 - 与活动数据高度相关
                    correlation = activity > 0 ? Math.min(0.9, Math.max(0.3, activity / 10)) : 0.3;
                    break;
                case 1: // 核心贡献者风险 - 与活动数据负相关
                    correlation = activity > 0 ? Math.max(-0.7, Math.min(-0.2, -activity / 15)) : -0.4;
                    break;
                case 2: // 贡献者增长 - 与潜力正相关
                    correlation = potential > 0 ? Math.min(0.8, Math.max(0.2, potential / 125)) : 0.3;
                    break;
                case 3: // 问题响应趋势 - 与活动负相关
                    correlation = activity > 0 ? Math.max(-0.6, Math.min(-0.1, -activity / 20)) : -0.3;
                    break;
                case 4: // OpenRank趋势 - 与潜力高度正相关
                    correlation = potential > 0 ? Math.min(0.9, Math.max(0.4, potential / 110)) : 0.4;
                    break;
                case 5: // 参与者趋势 - 与活动中等正相关
                    correlation = activity > 0 ? Math.min(0.7, Math.max(0.2, activity / 15)) : 0.3;
                    break;
                default:
                    correlation = 0.5;
            }
            
            heatmapData.push([monthIndex, dimIndex, parseFloat(correlation.toFixed(2))]);
        });
    });
    
    return heatmapData;
}

/**
 * 创建错误显示
 */
function createErrorDisplay(chartName, errorMessage) {
    return `
        <div style="text-align:center;padding:30px;color:#666;">
            <div style="font-size:48px;margin-bottom:10px;">📊</div>
            <h3 style="color:#FC757B;margin-bottom:10px;">${chartName}加载失败</h3>
            <p style="color:#999;font-size:12px;margin-bottom:15px;">${errorMessage}</p>
            <button onclick="location.reload()" style="
                padding:8px 16px;
                background:#65BDBA;
                color:white;
                border:none;
                border-radius:4px;
                cursor:pointer;
                font-size:12px;
            ">刷新图表</button>
        </div>
    `;
}

/**
 * 调整数组长度
 */
function adjustArrayLength(array, targetLength) {
    if (!Array.isArray(array)) {
        return Array(targetLength).fill(0);
    }
    
    if (array.length === targetLength) {
        return [...array];
    }
    
    if (array.length > targetLength) {
        return array.slice(0, targetLength);
    }
    
    // 如果数组长度不足，用最后一个值填充
    const result = [...array];
    const lastValue = result.length > 0 ? result[result.length - 1] : 0;
    
    while (result.length < targetLength) {
        // 添加轻微变化的值
        const variation = (Math.random() * 2 - 1) * 0.1;
        result.push(Math.max(0, lastValue + variation));
    }
    
    return result;
}

// ==================== 2. 数据转换函数 ====================

/**
 * 将API数据转换为仪表板所需格式
 */
function prepareDashboardData(apiData) {
    console.log('准备仪表板数据，API数据:', apiData);
    
    try {
        // 使用适配函数处理数据
        const result = adaptBackendData(apiData);
        
        // 验证维度数据 - 添加更详细的验证
        if (!result.dimensions) {
            console.error('维度数据不存在');
            throw new Error('维度数据不存在');
        }
        
        console.log('维度数据长度:', result.dimensions.length);
        console.log('维度数据内容:', result.dimensions);
        
        if (result.dimensions.length !== 6) {
            console.error('维度数据长度不正确:', result.dimensions.length);
            throw new Error(`维度数据不完整，需要6个维度，实际得到${result.dimensions.length}个`);
        }
        
        // 检查是否有维度值为0
        const zeroDimensions = result.dimensions.filter(d => d === 0);
        if (zeroDimensions.length > 0) {
            console.warn(`有${zeroDimensions.length}个维度值为0`);
        }
        
        return result;
    } catch (error) {
        console.error('数据适配失败:', error);
        throw error; // 直接抛出错误，不降级
    }
}
/**
 * 从API数据中提取活动数据
 */
function extractActivityData(detailedData) {
    let activityData = [];
    
    // 尝试多种可能的字段
    if (detailedData.activity && Array.isArray(detailedData.activity)) {
        activityData = detailedData.activity;
        console.log('使用 activity 字段');
    } else if (detailedData.openrank && Array.isArray(detailedData.openrank)) {
        activityData = detailedData.openrank;
        console.log('使用 openrank 字段');
    } else if (detailedData.contributors && Array.isArray(detailedData.contributors)) {
        activityData = detailedData.contributors;
        console.log('使用 contributors 字段');
    } else if (detailedData.participants && Array.isArray(detailedData.participants)) {
        activityData = detailedData.participants;
        console.log('使用 participants 字段');
    } else {
        console.warn('未找到活动数据字段，使用模拟数据');
        activityData = generateSampleActivityData();
    }
    
    // 清理和格式化数据
    return activityData.map(item => {
        const num = parseFloat(item);
        return isNaN(num) ? 0 : Math.abs(num);
    }).filter(item => item !== null && item !== undefined);
}


/**
 * 计算其他影响因素（6个月版本）
 */
function calculateOtherFactorsSixMonths(averagedData, monthIndex) {
    if (!averagedData) return 0;
    
    let score = 0;
    
    // 基于响应时间趋势
    const issueResponseTrend = averagedData.issue_response_time_trend || 0;
    score += (1 - Math.min(1, Math.abs(issueResponseTrend))) * 2;
    
    // 基于bus factor jump（风险越低越好）
    const busFactorJump = averagedData.bus_factor_jump || 0.5;
    score += (1 - Math.min(1, busFactorJump)) * 3;
    
    // 基于贡献者增长
    const contributorsJump = averagedData.contributors_jump || 0;
    score += Math.min(3, contributorsJump * 2);
    
    // 基于参与者趋势
    const participantsTrend = averagedData.participants_trend || 0;
    score += Math.min(2, participantsTrend * 1.5);
    
    // 基于OpenRank趋势
    const openrankTrend = averagedData.openrank_trend || 0;
    score += Math.min(3, openrankTrend * 2);
    
    // 时间衰减因素：越往后，影响越小
    score *= (1 - monthIndex * 0.05);
    
    return score;
}


// ==================== 3. 页面事件处理 ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，初始化事件监听');
    
    // 获取DOM元素
    const analyzeBtn = document.getElementById('analyzeBtn');
    const repoInput = document.getElementById('repo');
    const loading = document.querySelector('.loading');
    const errorMsg = document.getElementById('errorMsg');
    
    if (!analyzeBtn) {
        console.error('找不到分析按钮');
        return;
    }
    
    // 绑定点击事件
    analyzeBtn.addEventListener('click', async () => {
    const repo = repoInput.value.trim();
    if (!repo || !repo.includes('/')) {
        showError('请输入正确格式的仓库地址（格式: owner/repo）');
        return;
    }

    // 重置状态
    clearError();
    hideResult();
    showLoading();
    disableButton();

    try {
        console.log(`开始分析仓库: ${repo}`);
        
        // 发送请求到后端
        const data = await analyzeRepository(repo);
        console.log('收到后端数据:', data);
        
        // 验证后端数据
        if (!data || typeof data !== 'object') {
            throw new Error('后端返回的数据格式不正确');
        }
        
        // 显示基本结果
        displayResults(data);
        
        // 显示数据调试信息
        showDataDebugInfo(data);
        
        // 创建仪表板
        createDashboard(data);
        
        console.log('分析完成，仪表板已创建');
        
    } catch (err) {
        console.error('分析失败:', err);
        
        // 显示错误信息
        showError(err.message || '分析失败，请检查网络连接或稍后重试');
        
        // 不再使用模拟数据，直接显示错误
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.innerHTML = createErrorDisplay('数据分析', err.message);
        }
        
    } finally {
        hideLoading();
        enableButton();
    }
});
    
    // 添加回车键支持
    repoInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            analyzeBtn.click();
        }
    });
    
    console.log('事件监听初始化完成');
});

async function analyzeRepository(repo) {
    console.log('请求分析仓库:', repo);
    
    try {
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ repo: repo }),
            timeout: 30000
        });

        console.log('响应状态:', response.status, response.statusText);
        
        const rawText = await response.text();
        console.log('原始响应文本:', rawText);
        
        let data;
        try {
            data = JSON.parse(rawText);
            console.log('JSON解析成功，完整数据结构:');
            console.log(JSON.stringify(data, null, 2)); // 打印完整结构
            
            // 特别查看关键字段
            if (data.averaged_data) {
                console.log('averaged_data 字段:', Object.keys(data.averaged_data));
                for (const [key, value] of Object.entries(data.averaged_data)) {
                    console.log(`  ${key}:`, value);
                }
            }
            
            if (data.detailed_data) {
                console.log('detailed_data 字段:', Object.keys(data.detailed_data));
                for (const [key, value] of Object.entries(data.detailed_data)) {
                    console.log(`  ${key}:`, Array.isArray(value) ? `数组(${value.length})` : value);
                }
            }
            
        } catch (parseError) {
            console.error('JSON解析失败:', parseError);
            console.error('原始文本:', rawText);
            throw new Error('服务器返回的数据格式错误');
        }

        if (!response.ok) {
            console.error('请求失败:', data);
            throw new Error(data.error || data.message || `请求失败: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('请求失败详情:', error);
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('无法连接到分析服务器，请确保后端服务正在运行');
        }
        throw error;
    }
}

/**
 * 显示基本结果
 */
function displayResults(data) {
    try {
        const repoNameEl = document.getElementById('repoName');
        const potentialEl = document.getElementById('potential');
        const averagedDataEl = document.getElementById('averagedData');
        const detailedDataEl = document.getElementById('detailedData');
        const resultContainer = document.getElementById('resultContainer');
        
        if (repoNameEl) repoNameEl.textContent = data.repo || '未知仓库';
        if (potentialEl) potentialEl.textContent = data.potential || 0;
        
        // 格式化显示数据
        if (averagedDataEl && data.averaged_data) {
            averagedDataEl.textContent = JSON.stringify(data.averaged_data, null, 2);
        }
        
        if (detailedDataEl && data.detailed_data) {
            // 只显示部分详细数据，避免太长
            const simplified = {};
            for (const [key, value] of Object.entries(data.detailed_data)) {
                if (Array.isArray(value)) {
                    simplified[key] = value.length > 6 ? 
                        [...value.slice(0, 3), '...', ...value.slice(-3)] : 
                        value;
                } else {
                    simplified[key] = value;
                }
            }
            detailedDataEl.textContent = JSON.stringify(simplified, null, 2);
        }
        
        if (resultContainer) {
            resultContainer.style.display = 'block';
            resultContainer.scrollIntoView({ behavior: 'smooth' });
        }
    } catch (error) {
        console.error('显示结果失败:', error);
    }
}

/**
 * 创建仪表板
 */
function createDashboard(apiData) {
    try {
        const dashboardContainer = document.getElementById('dashboard-container');
        
        if (!dashboardContainer) {
            console.error('找不到仪表板容器');
            return;
        }

        console.log('=== 开始创建仪表板 ===');
        console.log('原始API数据:', apiData);
        
        // 先运行诊断
        console.log('=== 数据适配诊断开始 ===');
        diagnoseDataAdaptation(apiData);
        console.log('=== 数据适配诊断结束 ===');
        
        try {
            // 准备数据
            const dashboardData = prepareDashboardData(apiData);
            console.log('转换后的仪表板数据:', dashboardData);
            
            const months = generateSixMonthsLabels();
            
            // 验证数据
            if (!dashboardData.dimensions || dashboardData.dimensions.length !== 6) {
                console.error('维度数据:', dashboardData.dimensions);
                console.error('维度数量:', dashboardData.dimensions?.length);
                throw new Error(`维度数据不完整，需要6个维度，实际得到${dashboardData.dimensions?.length || 0}个`);
            }
            
            // 显示维度数据调试信息
            console.log('6个维度数据:');
            dashboardData.dimensionNames.forEach((name, index) => {
                console.log(`  ${index+1}. ${name}: ${dashboardData.dimensions[index]}`);
            });
            
            // 创建仪表板
            createPotentialDashboard(dashboardContainer, dashboardData, months);
            
        } catch (dataError) {
            console.error('数据转换失败:', dataError);
            
            // 显示详细的错误信息，包括实际数据结构
            dashboardContainer.innerHTML = `
                <div style="text-align:center;padding:40px;color:#666;">
                    <div style="font-size:48px;margin-bottom:10px;">⚠️</div>
                    <h3 style="color:#FC757B;margin-bottom:15px;">数据转换失败</h3>
                    <p style="color:#999;font-size:14px;margin-bottom:20px;">
                        ${dataError.message || '无法处理后端返回的数据'}
                    </p>
                    
                    <div style="background:#f5f5f5;padding:20px;border-radius:4px;text-align:left;margin-top:20px;">
                        <strong>实际收到的数据结构：</strong>
                        <button onclick="toggleDataStructure()" style="margin-left:10px;padding:3px 8px;font-size:11px;background:#65BDBA;color:white;border:none;border-radius:3px;cursor:pointer;">
                            显示/隐藏
                        </button>
                        <pre id="data-structure" style="font-size:11px;margin-top:10px;display:none;max-height:300px;overflow:auto;">
${JSON.stringify(apiData, null, 2)}
                        </pre>
                    </div>
                    
                    <div style="margin-top:30px;">
                        <button onclick="testWithSampleData()" style="padding:8px 16px;background:#3C9BC9;color:white;border:none;border-radius:4px;cursor:pointer;">
                            使用测试数据查看效果
                        </button>
                    </div>
                </div>
            `;
            
            // 添加切换显示的函数
            window.toggleDataStructure = function() {
                const pre = document.getElementById('data-structure');
                if (pre.style.display === 'none') {
                    pre.style.display = 'block';
                } else {
                    pre.style.display = 'none';
                }
            };
            
            // 添加测试数据函数
            window.testWithSampleData = function() {
                const sampleData = {
                    monthlyActivity: [10.88, 6.89, 11.74, 11.96, 18.13, 21.23],
                    monthlyPotential: [160, 162, 164, 166, 168, 170],
                    dimensions: [74, 90, 60, 81, 78, 72], // 基于你实际数据计算的值
                    dimensionNames: ['活动趋势', '核心贡献者风险', '贡献者增长', '问题响应趋势', 'OpenRank趋势', '参与者趋势']
                };
                
                const months = generateSixMonthsLabels();
                createPotentialDashboard(dashboardContainer, sampleData, months);
            };
        }
        
    } catch (error) {
        console.error('创建仪表板失败:', error);
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) {
            dashboardContainer.innerHTML = createErrorDisplay('仪表板', error.message);
        }
    }
}

/**
 * 显示数据调试信息
 */
function showDataDebugInfo(apiData, isMock = false) {
    try {
        const debugContainer = document.getElementById('debug-info') || 
            (() => {
                const div = document.createElement('div');
                div.id = 'debug-info';
                div.style.cssText = `
                    margin: 15px 0;
                    padding: 15px;
                    background: ${isMock ? '#fff8e1' : '#f0f7ff'};
                    border: 1px solid ${isMock ? '#ffd54f' : '#b3d9ff'};
                    border-radius: 4px;
                    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
                    font-size: 12px;
                    max-height: 300px;
                    overflow: auto;
                `;
                const resultContainer = document.querySelector('.result');
                if (resultContainer) {
                    const dashboardContainer = document.getElementById('dashboard-container');
                    if (dashboardContainer) {
                        resultContainer.insertBefore(div, dashboardContainer);
                    } else {
                        resultContainer.appendChild(div);
                    }
                }
                return div;
            })();
        
        let debugHTML = `<h4 style="margin-top:0;color:${isMock ? '#ff8f00' : '#0066cc'};">📊 数据信息 ${isMock ? '(模拟数据)' : ''}</h4>`;
        
        if (!apiData) {
            debugHTML += '<p style="color:red;">❌ 未收到API数据</p>';
        } else {
            // 基本信息
            debugHTML += `<p><strong>仓库:</strong> <code>${apiData.repo || 'N/A'}</code></p>`;
            debugHTML += `<p><strong>潜力值:</strong> <code>${apiData.potential || 'N/A'}</code></p>`;
            
            // 详细数据结构
            if (apiData.detailed_data) {
                debugHTML += '<p><strong>详细数据字段:</strong></p><ul style="margin-top:5px;padding-left:20px;">';
                let hasActivityData = false;
                
                for (const [key, value] of Object.entries(apiData.detailed_data)) {
                    const isArray = Array.isArray(value);
                    const length = isArray ? value.length : 'N/A';
                    const sample = isArray && value.length > 0 ? 
                        `[${value.slice(0, 3).map(v => 
                            typeof v === 'number' ? v.toFixed(2) : String(v).substring(0, 20)
                        ).join(', ')}${value.length > 3 ? '...' : ''}]` : 
                        String(value).substring(0, 50);
                    
                    // 标记活动数据
                    const isActivityField = key.toLowerCase().includes('activity') || 
                                          key.toLowerCase().includes('openrank');
                    const activityIcon = isActivityField && isArray ? '' : '';
                    
                    if (isActivityField && isArray) hasActivityData = true;
                    
                    debugHTML += `<li><code style="color:${isActivityField ? '#666' : '#666'}">${key}</code>: `;
                    debugHTML += `<span style="color:#999;">${isArray ? `数组(${length})` : '对象'}</span> `;
                    debugHTML += `<span>${sample}</span>${activityIcon}</li>`;
                }
                debugHTML += '</ul>';
                
                if (!hasActivityData) {
                    debugHTML += '<p style="color:#ff9800;margin-top:5px;">⚠️ 未找到标准的activity数据字段，使用其他字段作为活动指标</p>';
                }
            } else {
                debugHTML += '<p style="color:#ff9800;">⚠️ detailed_data 字段不存在</p>';
            }
            
            // 关键指标
            if (apiData.averaged_data) {
                debugHTML += '<p><strong>关键指标:</strong></p><ul style="margin-top:5px;padding-left:20px;">';
                const keyMetrics = [
                    'activity', 'openrank', 'contributors', 'participants', 
                    'bus_factor', 'issue_response_time', 'change_request_response_time'
                ];
                
                keyMetrics.forEach(metric => {
                    if (apiData.averaged_data[metric] !== undefined) {
                        debugHTML += `<li><code>${metric}</code>: <strong>${apiData.averaged_data[metric]}</strong></li>`;
                    }
                });
                debugHTML += '</ul>';
            }
        }
        
        // 添加操作按钮
        debugHTML += `
            <div style="margin-top:10px;display:flex;gap:10px;">
                <button onclick="toggleRawData()" style="
                    padding:5px 10px;
                    background:#65BDBA;
                    color:white;
                    border:none;
                    border-radius:3px;
                    cursor:pointer;
                    font-size:11px;
                ">📋 查看原始数据</button>
                <button onclick="copyDataToClipboard()" style="
                    padding:5px 10px;
                    background:#3C9BC9;
                    color:white;
                    border:none;
                    border-radius:3px;
                    cursor:pointer;
                    font-size:11px;
                ">📄 复制数据</button>
            </div>
            <div id="raw-data" style="display:none;margin-top:10px;">
                <pre style="
                    background:#fff;
                    padding:10px;
                    border:1px solid #ddd;
                    border-radius:3px;
                    max-height:200px;
                    overflow:auto;
                    font-size:11px;
                "></pre>
            </div>
        `;
        
        debugContainer.innerHTML = debugHTML;
        
        // 存储原始数据
        window.rawApiData = apiData;
        
    } catch (error) {
        console.error('显示调试信息失败:', error);
    }
}

/**
 * 切换显示原始数据
 */
function toggleRawData() {
    try {
        const rawDataDiv = document.getElementById('raw-data');
        const preElement = rawDataDiv?.querySelector('pre');
        
        if (!rawDataDiv || !preElement) return;
        
        if (rawDataDiv.style.display === 'none') {
            preElement.textContent = JSON.stringify(window.rawApiData, null, 2);
            rawDataDiv.style.display = 'block';
        } else {
            rawDataDiv.style.display = 'none';
        }
    } catch (error) {
        console.error('切换原始数据失败:', error);
    }
}

/**
 * 复制数据到剪贴板
 */
function copyDataToClipboard() {
    try {
        const dataStr = JSON.stringify(window.rawApiData, null, 2);
        navigator.clipboard.writeText(dataStr).then(() => {
            alert('数据已复制到剪贴板！');
        }).catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制控制台中的数据');
        });
    } catch (error) {
        console.error('复制数据失败:', error);
    }
}

// ==================== 4. UI辅助函数 ====================

function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
        errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function clearError() {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) {
        errorMsg.textContent = '';
        errorMsg.style.display = 'none';
    }
}

function showLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'block';
        loading.textContent = '正在分析仓库数据，请稍候...';
    }
}

function hideLoading() {
    const loading = document.querySelector('.loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function disableButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '分析中...';
        analyzeBtn.style.backgroundColor = '#cccccc';
    }
}

function enableButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '分析';
        analyzeBtn.style.backgroundColor = '#65BDBA';
    }
}

function hideResult() {
    const resultContainer = document.getElementById('resultContainer');
    if (resultContainer) {
        resultContainer.style.display = 'none';
        
        // 清空之前的图表和调试信息
        const dashboardContainer = document.getElementById('dashboard-container');
        if (dashboardContainer) dashboardContainer.innerHTML = '';
        
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) debugInfo.remove();
    }
}

/**
 * 计算6个月的潜力值
 */
function calculateMonthlyPotentialSixMonths(activityData, basePotential, averagedData) {
    if (!activityData || activityData.length === 0) {
        console.warn('活动数据为空，生成6个月模拟潜力数据');
        return ensureSixMonthsData([], true);
    }
    
    const monthlyPotential = [];
    
    for (let i = 0; i < 6; i++) {
        let potential = basePotential;
        
        // 1. 活动数据影响
        const activityRatio = activityData[i] / Math.max(...activityData);
        potential += activityRatio * 15;
        
        // 2. 时间趋势影响
        potential += i * 2;
        
        // 3. activity_trend影响
        if (averagedData.activity_trend !== undefined) {
            potential += averagedData.activity_trend * 2;
        }
        
        // 4. 其他指标的影响
        const otherFactors = calculateOtherFactorsSixMonths(averagedData, i);
        potential += otherFactors;
        
        // 5. 限制范围
        potential = Math.min(100, Math.max(0, parseFloat(potential.toFixed(1))));
        monthlyPotential.push(potential);
    }
    
    console.log('计算的6个月潜力值:', monthlyPotential);
    return monthlyPotential;
}

/**
 * 提取原始趋势数据
 */
function extractRawTrends(apiData) {
    const averaged = apiData.averaged_data || {};
    const trends = [];
    
    // 提取6个原始趋势值
    const trendFields = [
        'activity_trend',
        'bus_factor_jump', 
        'contributors_jump',
        'issue_response_time_trend',
        'openrank_trend',
        'participants_trend'
    ];
    
    trendFields.forEach(field => {
        const value = averaged[field];
        if (value !== undefined && value !== null) {
            trends.push(parseFloat(value));
        } else {
            trends.push(0); // 默认值
            console.warn(`字段 ${field} 不存在或为空`);
        }
    });
    
    console.log('提取的原始趋势:', trends);
    return trends;
}

/**
 * 通用数据适配函数 - 处理各种可能的后端数据结构
 */
function adaptBackendData(apiData) {
    console.log('适配后端数据，原始API数据:', apiData);
    
    // 如果没有数据，抛出错误
    if (!apiData) {
        throw new Error('后端未返回数据');
    }
    
    const result = {
        monthlyActivity: [],
        monthlyPotential: [],
        currentPotential: parseFloat(apiData.potential) || 65,
        basePotential: parseFloat(apiData.potential) || 65,
        rawTrends: [],  // 存储6个维度的原始趋势值
        dimensions: [],  // 为了兼容性，也存储原始值（后续会统一使用rawTrends）
        dimensionNames: ['活动趋势', '核心贡献者风险', '贡献者增长', '问题响应趋势', 'OpenRank趋势', '参与者趋势'],
        trendConfigs: [] // 存储每个维度的配置信息
    };
    
    console.log('当前潜力值:', result.currentPotential);
    
    // 1. 提取6个月的活动数据
    if (apiData.detailed_data && apiData.detailed_data.activity && Array.isArray(apiData.detailed_data.activity)) {
        const activityData = apiData.detailed_data.activity;
        console.log('找到activity数据，长度:', activityData.length);
        result.monthlyActivity = ensureSixMonthsData(activityData, false);
    } else {
        console.warn('未找到activity数据，使用默认值');
        result.monthlyActivity = [10, 12, 15, 18, 20, 22];
    }
    
    console.log('月度活动数据:', result.monthlyActivity);
    
    // 2. 使用真实的后端潜力值构建6个月的趋势
    if (result.currentPotential > 0) {
        if (apiData.detailed_data && apiData.detailed_data.potential && Array.isArray(apiData.detailed_data.potential)) {
            const potentialData = apiData.detailed_data.potential;
            result.monthlyPotential = ensureSixMonthsData(potentialData, true);
        } else {
            result.monthlyPotential = generateMonthlyPotentialTrend(result.currentPotential, result.monthlyActivity);
        }
        console.log('月度潜力数据:', result.monthlyPotential);
    } else {
        console.warn('潜力值为0，使用模拟数据');
        result.monthlyPotential = [60, 62, 65, 68, 70, 72];
    }
    
    // 3. 提取6个维度的原始趋势数据（不映射到0-100）
    result.rawTrends = extractRawTrends(apiData);
    result.dimensions = [...result.rawTrends]; // 为了兼容性
    
    // 4. 为每个维度配置显示参数
    result.trendConfigs = [
        { // 活动趋势
            name: '活动趋势',
            rawValue: result.rawTrends[0],
            description: '代码提交、PR等活动变化趋势',
            unit: '%',
            format: (v) => `${(v * 100).toFixed(1)}%`,
            min: -1,
            max: 1,
            isPositive: true
        },
        { // 核心贡献者风险
            name: '核心贡献者风险', 
            rawValue: result.rawTrends[1],
            description: '核心开发者变动风险（0-1范围，0表示无风险）',
            unit: '',
            format: (v) => v === 0 ? '无风险' : `风险指数: ${v.toFixed(2)}`,
            min: 0,
            max: 1,
            isPositive: false
        },
        { // 贡献者增长
            name: '贡献者增长',
            rawValue: result.rawTrends[2],
            description: '新贡献者加入的增长情况',
            unit: '%',
            format: (v) => `${(v * 100).toFixed(1)}%`,
            min: -1,
            max: 1,
            isPositive: true
        },
        { // 问题响应趋势
            name: '问题响应趋势',
            rawValue: result.rawTrends[3],
            description: 'Issue和PR响应时间的变化（负值表示改善）',
            unit: '%',
            format: (v) => v < 0 ? `-${(Math.abs(v) * 100).toFixed(1)}%` : ` ${(v * 100).toFixed(1)}%`,
            min: -1,
            max: 1,
            isPositive: false 
        },
        { // OpenRank趋势
            name: 'OpenRank趋势',
            rawValue: result.rawTrends[4],
            description: '项目在开源生态中的影响力变化',
            unit: '%',
            format: (v) => `${(v * 100).toFixed(1)}%`,
            min: -0.5,
            max: 1.5,
            isPositive: true
        },
        { // 参与者趋势
            name: '参与者趋势',
            rawValue: result.rawTrends[5],
            description: '社区参与者的增长情况',
            unit: '%',
            format: (v) => `${(v * 100).toFixed(1)}%`,
            min: -0.5,
            max: 1,
            isPositive: true
        }
    ];
    
    console.log('适配后的完整数据（保留原始值）:');
    console.log('- 原始趋势数据:', result.rawTrends);
    console.log('- 趋势配置:', result.trendConfigs);
    console.log('- 月度潜力:', result.monthlyPotential);
    console.log('- 月度活动:', result.monthlyActivity);
    
    return result;
}

/**
 * 基于当前潜力值和活动数据生成月度潜力趋势
 */
function generateMonthlyPotentialTrend(currentPotential, monthlyActivity) {
    if (!currentPotential || currentPotential <= 0) {
        console.warn('当前潜力值无效，使用默认数据');
        return [60, 62, 65, 68, 70, 72];
    }
    
    const monthlyPotential = [];
    const trend = 1.5; // 每月增长趋势
    const startPotential = currentPotential * 0.85; // 从略低于当前值开始
    
    console.log('生成潜力趋势: 当前值=', currentPotential, '起始值=', startPotential);
    
    // 如果活动数据有效，基于活动数据调整潜力值
    if (monthlyActivity && monthlyActivity.length >= 6) {
        // 找到最大活动值用于归一化
        const maxActivity = Math.max(...monthlyActivity);
        const minActivity = Math.min(...monthlyActivity);
        const activityRange = maxActivity - minActivity || 1;
        
        for (let i = 0; i < 6; i++) {
            // 基于活动数据的相对位置计算潜力
            const activityRatio = (monthlyActivity[i] - minActivity) / activityRange;
            const monthIndex = i; // 0-5
            const timeFactor = monthIndex * trend;
            
            // 计算该月潜力：起始值 + 时间趋势 + 活动影响
            let monthPotential = startPotential + timeFactor + (activityRatio * 8);
            
            // 最后一个月的值应该接近当前潜力值
            if (i === 5) {
                monthPotential = currentPotential;
            }
            
            // 确保在合理范围内
            monthPotential = Math.max(60, Math.min(200, monthPotential));
            monthlyPotential.push(Math.round(monthPotential * 10) / 10);
        }
    } else {
        // 如果没有活动数据，创建逐渐增长的潜力趋势
        for (let i = 0; i < 6; i++) {
            let monthPotential;
            if (i < 5) {
                // 前5个月线性增长到当前值
                monthPotential = startPotential + (i * ((currentPotential - startPotential) / 5));
            } else {
                // 第6个月等于当前值
                monthPotential = currentPotential;
            }
            
            monthPotential = Math.max(60, Math.min(200, monthPotential));
            monthlyPotential.push(Math.round(monthPotential * 10) / 10);
        }
    }
    
    console.log('生成的月度潜力趋势:', monthlyPotential);
    return monthlyPotential;
}

/**
 * 获取6个维度的中文名称（已在上面的prepareDashboardData中使用）
 */
function getSixDimensionNames() {
    return [
        '活动趋势',
        '核心贡献者风险',
        '贡献者增长',
        '问题响应趋势',
        'OpenRank趋势',
        '参与者趋势'
    ];
}

// ==================== 5. 初始化测试 ====================

// 页面加载完成后进行一些初始化
window.addEventListener('load', function() {
    console.log('页面完全加载');
    console.log('ECharts版本:', echarts.version);
    console.log('createPotentialDashboard 可用:', typeof createPotentialDashboard === 'function');
    
    // 检查后端连接
    checkBackendConnection();
});

/**
 * 检查后端连接状态
 */
async function checkBackendConnection() {
    try {
        const response = await fetch('http://localhost:5000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repo: 'test/test' }),
            signal: AbortSignal.timeout(3000)
        }).catch(() => null);
        
        if (response && response.status !== 404) {
            console.log('✅ 后端服务连接正常');
        } else {
            console.warn('⚠️ 后端服务可能未启动，将使用模拟数据');
            showConnectionWarning();
        }
    } catch (error) {
        console.warn('后端连接检查失败:', error.message);
    }
}

// 添加这个测试函数到你的代码中
function runDebugTest() {
    console.log('=== 运行调试测试 ===');
    
    const testData = {
        "averaged_data": {
            "activity_trend": 0.9512866772714451,
            "bus_factor_jump": 0,
            "contributors_jump": 0,
            "issue_response_time_trend": -0.7614284626530767,
            "openrank_trend": 0.42505583332084274,
            "participants_trend": 0.33333327777778704
        },
        "detailed_data": {
            "activity": [10.88, 6.89, 11.74, 11.96, 18.13, 21.23],
            "openrank": [4.47, 4.89, 4.86, 4.19, 5.62, 6.37]
        },
        "potential": 154.25,
        "repo": "X-lab2017/open-digger"
    };
    
    
    console.log('2. 测试 adaptBackendData 函数:');
    try {
        const result = adaptBackendData(testData);
        console.log('适配结果:', result);
        console.log('维度数据:', result.dimensions);
        console.log('维度数量:', result.dimensions.length);
    } catch (error) {
        console.error('适配失败:', error);
    }
}


/**
 * 诊断数据适配问题
 */
function diagnoseDataAdaptation(apiData) {
    console.log('=== 数据适配诊断 ===');
    
    if (!apiData) {
        console.error('❌ API数据为空');
        return;
    }
    
    console.log('1. API数据结构:', Object.keys(apiData));
    
    if (apiData.averaged_data) {
        console.log('2. averaged_data字段:', Object.keys(apiData.averaged_data));
        
        // 检查6个关键维度字段
        const neededFields = [
            'activity_trend', 'bus_factor_jump', 'contributors_jump',
            'issue_response_time_trend', 'openrank_trend', 'participants_trend'
        ];
        
        console.log('3. 检查6个维度字段:');
        neededFields.forEach(field => {
            const exists = apiData.averaged_data[field] !== undefined;
            console.log(`   ${field}: ${exists ? '✅' : '❌'}`);
        });
        

    } else {
        console.warn('⚠️ 缺少 averaged_data 字段');
    }
    
    if (apiData.detailed_data) {
        console.log('5. detailed_data字段:', Object.keys(apiData.detailed_data));
        
        // 检查活动数据
        let foundActivity = false;
        const activityFields = ['activity', 'openrank', 'contributors', 'participants'];
        activityFields.forEach(field => {
            if (apiData.detailed_data[field] && Array.isArray(apiData.detailed_data[field])) {
                console.log(`   ✅ 找到活动数据字段: ${field}, 长度: ${apiData.detailed_data[field].length}`);
                foundActivity = true;
            }
        });
        
        if (!foundActivity) {
            console.warn('   ⚠️ 未找到活动数据数组');
        }
    }
    
    console.log('=== 诊断结束 ===');
}

/**
 * 测试数据转换
 */
function testDataConversion() {
    const testData = {
        "averaged_data": {
            "activity_trend": 0.9512866772714451,
            "bus_factor_jump": 0,
            "contributors_jump": 0,
            "issue_response_time_trend": -0.7614284626530767,
            "openrank_trend": 0.42505583332084274,
            "participants_trend": 0.33333327777778704
        },
        "detailed_data": {
            "activity": [10.88, 6.89, 11.74, 11.96, 18.13, 21.23],
            "openrank": [4.47, 4.89, 4.86, 4.19, 5.62, 6.37]
        },
        "potential": 154.25,
        "repo": "X-lab2017/open-digger"
    };
    
    console.log('=== 测试数据转换 ===');
    try {
        const result = adaptBackendData(testData);
        console.log('转换结果:', result);
        console.log('维度数量:', result.dimensions.length);
        console.log('维度数据:', result.dimensions);
    } catch (error) {
        console.error('转换失败:', error);
    }
}

/**
 * 测试后端数据结构
 */
async function testBackendDataStructure() {
    try {
        console.log('测试后端数据结构...');
        
        // 这里可以测试一个已知的仓库
        const testRepo = 'torvalds/linux'; // 或者你已知的仓库
        
        const data = await analyzeRepository(testRepo);
        console.log('测试仓库返回的数据结构:');
        console.log(JSON.stringify(data, null, 2));
        
        // 显示关键信息
        if (data.averaged_data) {
            console.log('averaged_data 包含的字段:');
            console.log(Object.keys(data.averaged_data).join(', '));
            
            // 检查我们需要的6个维度字段
            const neededFields = ['activity_trend', 'bus_factor_jump', 'contributors_jump', 
                                  'issue_response_time_trend', 'openrank_trend', 'participants_trend'];
            
            console.log('检查6个维度字段是否存在:');
            neededFields.forEach(field => {
                const exists = data.averaged_data[field] !== undefined;
                console.log(`${field}: ${exists ? '✅' : '❌'}`);
            });
        }
        
    } catch (error) {
        console.error('测试失败:', error);
    }
}

// 页面加载后自动测试
window.addEventListener('load', function() {
    // 可以取消注释下面这行来自动测试
    // testBackendDataStructure();
});

/**
 * 显示连接警告
 */
function showConnectionWarning() {
    const warningDiv = document.createElement('div');
    warningDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 15px;
        background: #fff3cd;
        border: 1px solid #ffecb5;
        border-radius: 4px;
        color: #856404;
        font-size: 12px;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    warningDiv.innerHTML = `
        <strong>⚠️ 后端未连接</strong>
        <p style="margin:5px 0 0 0;">正在使用模拟数据，如需真实分析请启动后端服务。</p>
    `;
    document.body.appendChild(warningDiv);
    
    // 5秒后自动消失
    setTimeout(() => {
        warningDiv.style.opacity = '0';
        warningDiv.style.transition = 'opacity 0.5s';
        setTimeout(() => warningDiv.remove(), 500);
    }, 5000);
}

// 导出全局函数
window.createPotentialDashboard = createPotentialDashboard;
window.toggleRawData = toggleRawData;
window.copyDataToClipboard = copyDataToClipboard;

console.log('avisualization.js 加载完成');