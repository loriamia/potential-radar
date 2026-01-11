console.log('app.js 开始加载');

// ==================== 1. 仪表板核心函数 ====================

/**
 * 创建仓库潜力综合分析仪表板
 * @param {HTMLElement} container - 图表容器
 * @param {Object} data - 仪表板数据
 * @param {Array} months - 月份标签
 */
function createPotentialDashboard(container, data, months) {
    console.log('创建仪表板，传入的data:', data);
    console.log('data结构:', Object.keys(data));
    
    if (!container) {
        console.error('仪表板容器不存在');
        return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建仪表板容器
    const dashboard = document.createElement('div');
    dashboard.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 400px 400px;
        gap: 20px;
        margin: 20px 0;
        width: 100%;
    `;
    dashboard.className = 'dashboard-grid';
    
    container.appendChild(dashboard);
    
    // 创建四个图表容器
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
    
    // 创建图表
    try {
        createComboChart(chartContainers[0], data, months);
        createLineComparisonChart(chartContainers[1], data, months); // 简化的折线图
        createRadarChart(chartContainers[2], data);
        createProgressChart(chartContainers[3], data, months);
        
        console.log('所有图表创建完成');
    } catch (error) {
        console.error('创建图表失败:', error);
    }
}

/**
 * 1. 组合图表 - 展示月度趋势与潜力关系（6个月）
 */
function createComboChart(container, data, months) {
    try {
        console.log('创建组合图（6个月），数据:', data.monthlyActivity, data.currentPotential);
        
        // 确保有6个月的数据
        const activityData = data.monthlyActivity || [];
        const potentialData = data.currentPotential || [];
        console.log('！！！！当前潜力值数据',data.currentPotential)
        
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
    // if (!Array.isArray(data) || data.length === 0) {
    //     // 生成6个月的模拟数据
    //     const baseValue = isPotential ? 65 : 50;
    //     const trend = isPotential ? 2 : 0.5;
        
    //     return Array(6).fill(0).map((_, i) => {
    //         const variation = (Math.random() * 2 - 1) * (isPotential ? 1.5 : 0.3);
    //         return baseValue + i * trend + variation;
    //     }).map(v => parseFloat(v.toFixed(1)));
    // }
    
    // 如果数据多于6个，取最后6个
    // if (data.length > 6) {
    //     return data.slice(-6);
    // }
    
    // 如果数据少于6个，补充数据
    // if(isPotential = true){
    //     console.log('！！！！当前潜力值数据',data)
    // }
    
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
    const months = ['七月', '八月', '九月', '十月', '十一月', '十二月'];
    return months;
}

/**
 * 2. 简化的折线对比图 - 直接使用数据
 */
function createLineComparisonChart(container, data, months) {
    console.log('=== 创建折线图 - 开始 ===');
    console.log('传入的data:', data);
    
    try {
        // 直接使用数据中的detailedData，如果不存在则尝试其他方式
        let detailedData = data.detailedData || {};
        
        console.log('detailedData:', detailedData);
        console.log('detailedData字段:', Object.keys(detailedData));
        
        // 如果detailedData是空的，尝试从其他地方获取
        if (Object.keys(detailedData).length === 0) {
            console.log('detailedData为空，检查其他可能的来源');
            
            // 尝试从rawApiData获取
            if (data.rawApiData && data.rawApiData.detailed_data) {
                detailedData = data.rawApiData.detailed_data;
                console.log('从rawApiData获取:', detailedData);
            }
            // 尝试从data本身获取（可能数据直接放在了data中）
            else if (data.contributors || data.participants) {
                detailedData = {
                    contributors: data.contributors,
                    participants: data.participants,
                    activity: data.monthlyActivity
                };
                console.log('从data直接获取:', detailedData);
            }
        }
        
        // 获取数据
        let contributorsData = detailedData.contributors || [];
        let participantsData = detailedData.participants || [];
        
        console.log('contributorsData:', contributorsData);
        console.log('participantsData:', participantsData);
        
        // 如果还是没有数据，使用硬编码的模拟数据
        if (contributorsData.length === 0 || participantsData.length === 0) {
            console.log('使用硬编码的模拟数据');
            contributorsData = [2, 2, 2, 4, 3, 1];
            participantsData = [6, 2, 3, 4, 4, 8];
        }
        
        const monthLabels = months || generateSixMonthsLabels();
        
        // 确保数据长度为6个月
        const adjustedContributorsData = ensureSixMonthsData(contributorsData, false);
        const adjustedParticipantsData = ensureSixMonthsData(participantsData, false);
        
        console.log('最终使用的数据:');
        console.log('Contributors:', adjustedContributorsData);
        console.log('Participants:', adjustedParticipantsData);
        
        const chart = echarts.init(container);
        
        const option = {
            title: { 
                text: '贡献者 vs 参与者趋势分析',
                left: 'center',
                textStyle: { fontSize: 14, color: '#333' }
            },
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    const month = params[0].axisValue;
                    const monthIndex = monthLabels.indexOf(month);
                    
                    const contributors = adjustedContributorsData[monthIndex] || 0;
                    const participants = adjustedParticipantsData[monthIndex] || 0;
                    
                    return `
                        <div style="font-weight:bold;margin-bottom:5px;">${month}</div>
                        <div style="display:flex;align-items:center;margin:3px 0;">
                            <span style="display:inline-block;width:10px;height:10px;background:#65BDBA;border-radius:50%;margin-right:5px;"></span>
                            <span>贡献者: <strong>${contributors}人</strong></span>
                        </div>
                        <div style="display:flex;align-items:center;margin:3px 0;">
                            <span style="display:inline-block;width:10px;height:10px;background:#FAA26F;border-radius:50%;margin-right:5px;"></span>
                            <span>参与者: <strong>${participants}人</strong></span>
                        </div>
                    `;
                }
            },
            legend: {
                data: ['贡献者', '参与者'],
                top: 30,
                textStyle: { color: '#666' }
            },
            grid: { 
                left: 50, 
                right: 50, 
                top: 70, 
                bottom: 50 
            },
            xAxis: {
                type: 'category',
                data: monthLabels,
                axisLine: { lineStyle: { color: '#ccc' } },
                axisLabel: { color: '#666', interval: 0 }
            },
            yAxis: {
                type: 'value',
                name: '数量 (人)',
                min: 0,
                axisLine: { show: true, lineStyle: { color: '#999' } },
                splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
            },
            series: [
                {
                    name: '贡献者',
                    type: 'line',
                    data: adjustedContributorsData,
                    lineStyle: { color: '#65BDBA', width: 3 },
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: { color: '#65BDBA' },
                    label: {
                        show: true,
                        position: 'top',
                        formatter: '{c}',
                        color: '#65BDBA',
                        fontSize: 11
                    }
                },
                {
                    name: '参与者',
                    type: 'line',
                    data: adjustedParticipantsData,
                    lineStyle: { color: '#FAA26F', width: 3, type: 'dashed' },
                    symbol: 'diamond',
                    symbolSize: 10,
                    itemStyle: { color: '#FAA26F' },
                    label: {
                        show: true,
                        position: 'bottom',
                        formatter: '{c}',
                        color: '#FAA26F',
                        fontSize: 11
                    }
                }
            ]
        };
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        
        console.log('=== 折线图创建完成 ===');
        return chart;
        
    } catch (error) {
        console.error('创建折线图失败:', error);
        console.error('错误堆栈:', error.stack);
        
        // 显示简单的错误信息
        container.innerHTML = `
            <div style="text-align:center;padding:30px;color:#666;">
                <div style="font-size:48px;margin-bottom:10px;">📊</div>
                <h3 style="color:#65BDBA;margin-bottom:10px;">趋势分析</h3>
                <p style="color:#999;font-size:12px;">
                    贡献者 vs 参与者趋势
                </p>
                <div style="margin-top:20px;color:#FC757B;font-size:11px;">
                    数据加载中...
                </div>
            </div>
        `;
        
        // 使用模拟数据重试
        setTimeout(() => {
            const months = generateSixMonthsLabels();
            const mockContributors = [2, 2, 2, 4, 3, 1];
            const mockParticipants = [6, 2, 3, 4, 4, 8];
            
            const chart = echarts.init(container);
            const option = {
                title: { text: '贡献者 vs 参与者趋势分析 (模拟数据)', left: 'center' },
                xAxis: { type: 'category', data: months },
                yAxis: { type: 'value', name: '数量' },
                series: [
                    { name: '贡献者', type: 'line', data: mockContributors },
                    { name: '参与者', type: 'line', data: mockParticipants }
                ]
            };
            chart.setOption(option);
        }, 1000);
        
        return null;
    }
}

/**
 * 创建图表的辅助函数
 */
function createChartWithData(container, contributorsData, participantsData, months, isMock = false) {
    try {
        const monthLabels = months || generateSixMonthsLabels();
        
        // 确保数据长度为6个月
        const adjustedContributorsData = ensureSixMonthsData(contributorsData, false);
        const adjustedParticipantsData = ensureSixMonthsData(participantsData, false);
        
        console.log('创建图表使用的数据:');
        console.log('Contributors:', adjustedContributorsData);
        console.log('Participants:', adjustedParticipantsData);
        console.log('是否模拟数据:', isMock);
        
        const chart = echarts.init(container);
        
        // 计算累计变化
        const totalContributorsChange = contributorsData.length > 1 ? 
            contributorsData[contributorsData.length - 1] - contributorsData[0] : 0;
        const totalParticipantsChange = participantsData.length > 1 ? 
            participantsData[participantsData.length - 1] - participantsData[0] : 0;
        
        const option = {
            title: { 
                text: '贡献者 vs 参与者趋势分析' + (isMock ? ' (模拟数据)' : ''),
                subtext: `累计变化: 贡献者${totalContributorsChange >= 0 ? '+' : ''}${totalContributorsChange}, 参与者${totalParticipantsChange >= 0 ? '+' : ''}${totalParticipantsChange}`,
                left: 'center',
                textStyle: { fontSize: 14, color: isMock ? '#FC757B' : '#333' },
                subtextStyle: { fontSize: 11, color: '#666' }
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(255,255,255,0.95)',
                borderColor: '#ddd',
                borderWidth: 1,
                textStyle: { color: '#333' },
                formatter: function(params) {
                    const month = params[0].axisValue;
                    const monthIndex = monthLabels.indexOf(month);
                    
                    let result = `<div style="font-weight:bold;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #eee;color:#333;">${month}</div>`;
                    
                    const actualContributors = adjustedContributorsData[monthIndex] || 0;
                    const actualParticipants = adjustedParticipantsData[monthIndex] || 0;
                    
                    result += `
                        <div style="margin-bottom:6px;">
                            <div style="display:flex;align-items:center;margin-bottom:3px;">
                                <span style="display:inline-block;width:10px;height:10px;background:#65BDBA;border-radius:50%;margin-right:5px;"></span>
                                <span><strong>贡献者:</strong> <span style="color:#65BDBA;font-weight:bold;">${actualContributors}人</span></span>
                            </div>
                            <div style="display:flex;align-items:center;">
                                <span style="display:inline-block;width:10px;height:10px;background:#FAA26F;border-radius:50%;margin-right:5px;"></span>
                                <span><strong>参与者:</strong> <span style="color:#FAA26F;font-weight:bold;">${actualParticipants}人</span></span>
                            </div>
                        </div>
                    `;
                    
                    if (isMock) {
                        result += `<div style="color:#FC757B;font-size:10px;margin-top:5px;padding:3px;background:#fff0f0;border-radius:2px;">
                            ⚠️ 使用模拟数据展示效果
                        </div>`;
                    }
                    
                    return result;
                }
            },
            legend: {
                data: ['贡献者', '参与者'],
                top: isMock ? 45 : 35,
                textStyle: { color: '#666' }
            },
            grid: { 
                left: 50, 
                right: 50, 
                top: isMock ? 95 : 85, 
                bottom: 50,
                backgroundColor: '#fafafa'
            },
            xAxis: {
                type: 'category',
                data: monthLabels,
                axisLine: { lineStyle: { color: '#ccc' } },
                axisLabel: { color: '#666', interval: 0 }
            },
            yAxis: {
                type: 'value',
                name: '数量 (人)',
                axisLine: { show: true, lineStyle: { color: '#999' } },
                axisLabel: { color: '#666' },
                nameTextStyle: { color: '#666' },
                splitLine: { lineStyle: { type: 'dashed', color: '#eee' } },
                min: 0
            },
            series: [
                {
                    name: '贡献者',
                    type: 'line',
                    data: adjustedContributorsData,
                    smooth: false,
                    lineStyle: { color: '#65BDBA', width: 3 },
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: { color: '#65BDBA', borderColor: '#fff', borderWidth: 2 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(101, 189, 186, 0.3)' },
                            { offset: 1, color: 'rgba(101, 189, 186, 0.05)' }
                        ])
                    },
                    label: {
                        show: true,
                        position: 'top',
                        formatter: '{c}',
                        color: '#65BDBA',
                        fontSize: 11,
                        fontWeight: 'bold'
                    }
                },
                {
                    name: '参与者',
                    type: 'line',
                    data: adjustedParticipantsData,
                    smooth: false,
                    lineStyle: { color: '#FAA26F', width: 3, type: 'dashed' },
                    symbol: 'diamond',
                    symbolSize: 10,
                    itemStyle: { color: '#FAA26F', borderColor: '#fff', borderWidth: 2 },
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(250, 162, 111, 0.2)' },
                            { offset: 1, color: 'rgba(250, 162, 111, 0.05)' }
                        ])
                    },
                    label: {
                        show: true,
                        position: 'bottom',
                        formatter: '{c}',
                        color: '#FAA26F',
                        fontSize: 11,
                        fontWeight: 'bold'
                    }
                }
            ]
        };
        
        if (isMock) {
            option.graphic = [
                {
                    type: 'text',
                    left: 'center',
                    top: 70,
                    style: {
                        text: '⚠️ 当前显示为模拟数据，实际数据未加载',
                        fill: '#FC757B',
                        fontSize: 10,
                        fontWeight: 'bold'
                    }
                }
            ];
        }
        
        chart.setOption(option);
        window.addEventListener('resize', () => chart.resize());
        
        console.log('折线对比图创建完成');
        return chart;
    } catch (error) {
        console.error('创建图表失败:', error);
        container.innerHTML = createErrorDisplay('图表', error.message);
        return null;
    }
}

/**
 * 计算月环比变化（绝对值变化）
 */
function calculateMonthlyChanges(data) {
    if (!data || data.length < 2) return [];
    
    const changes = [0]; // 第一个月没有变化
    
    for (let i = 1; i < data.length; i++) {
        const prev = data[i - 1] || 0;
        const current = data[i] || 0;
        changes.push(current - prev);
    }
    
    return changes;
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
        const currentPotential = data.currentPotential?.[data.currentPotential.length - 1] || 65;
        const potentialGrowth = data.currentPotential ? 
            (data.currentPotential[data.currentPotential.length - 1] - (data.currentPotential[data.currentPotential.length - 2])) : 0;
        const chart = echarts.init(container);
        
        const option = {
            title: { 
                text: '潜力达成分析',
                left: 'center',
                textStyle: { fontSize: 14 }
            },
            tooltip: { 
                trigger: 'item',
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
                            value: 80,
                            itemStyle: { 
                                color: potentialGrowth > 0 ? 
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
                            value: 100 - (potentialGrowth > 0 ? 40 : 15),
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
                        text: `潜力值趋势: ${potentialGrowth >= 0 ? '增长' : '下降'}`,
                        fill: '#65BDBA',
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
        if (potentialEl) potentialEl.textContent = data.potential[5] || 0;
        
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

function createDashboard(apiData) {
    try {
        const dashboardContainer = document.getElementById('dashboard-container');
        
        if (!dashboardContainer) {
            console.error('找不到仪表板容器');
            return;
        }

        console.log('=== 开始创建仪表板 ===');
        console.log('原始API数据的结构:', Object.keys(apiData));
        console.log('原始API数据:', apiData);
        
        // 直接打印详细数据
        console.log('API数据中的detailed_data:', apiData.detailed_data);
        console.log('detailed_data的字段:', apiData.detailed_data ? Object.keys(apiData.detailed_data) : 'null');
        
        try {
            // 准备数据
            const dashboardData = prepareDashboardData(apiData);
            console.log('=== 转换后的仪表板数据 ===');
            console.log('dashboardData结构:', Object.keys(dashboardData));
            console.log('dashboardData内容:', dashboardData);
            
            // 特别检查detailedData
            console.log('dashboardData.detailedData:', dashboardData.detailedData);
            console.log('dashboardData.detailedData字段:', dashboardData.detailedData ? Object.keys(dashboardData.detailedData) : 'null');
            
            const months = generateSixMonthsLabels();
            
            // 创建仪表板
            createPotentialDashboard(dashboardContainer, dashboardData, months);
            
        } catch (dataError) {
            console.error('数据转换失败:', dataError);
            console.error('错误堆栈:', dataError.stack);
            
            // 使用模拟数据创建图表
            const months = generateSixMonthsLabels();
            const mockData = {
                monthlyActivity: [10.88, 6.89, 11.74, 11.96, 18.13, 21.23],
                monthlyPotential: [160, 162, 164, 166, 168, 170],
                dimensions: [74, 90, 60, 81, 78, 72],
                dimensionNames: ['活动趋势', '核心贡献者风险', '贡献者增长', '问题响应趋势', 'OpenRank趋势', '参与者趋势'],
                detailedData: {
                    contributors: [2, 2, 2, 4, 3, 1],
                    participants: [6, 2, 3, 4, 4, 8],
                    activity: [10.88, 6.89, 11.74, 11.96, 18.13, 21.23],
                    bus_factor: [6, 2, 2, 2, 1, 2],
                    issue_response_time: [7, 9, 28.33, 0, 1, 12.33],
                    openrank: [4.47, 4.89, 4.86, 4.19, 5.62, 6.37]
                }
            };
            
            console.log('使用模拟数据创建仪表板:', mockData);
            createPotentialDashboard(dashboardContainer, mockData, months);
        }
        
    } catch (error) {
        console.error('创建仪表板失败:', error);
        console.error('错误堆栈:', error.stack);
        
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

function adaptBackendData(apiData) {
    console.log('=== adaptBackendData 开始 ===');
    console.log('传入的apiData:', apiData);
    
    if (!apiData) {
        throw new Error('后端未返回数据');
    }
    
    const detailedData = apiData.detailed_data || {};
    console.log('detailedData:', detailedData);
    
    // 提取原始趋势
    const rawTrends = extractRawTrends(apiData);
    console.log('rawTrends:', rawTrends);
    
    // 创建trendConfigs
    const trendConfigs = [
        { // 活动趋势
            name: '活动趋势',
            rawValue: rawTrends[0] || 0,
            description: '代码提交、PR等活动变化趋势',
            unit: '%',
            format: (v) => `${(v * 100).toFixed(1)}%`,
            min: -1,
            max: 1,
            isPositive: true
        },
        { // 核心贡献者风险
            name: '核心贡献者风险', 
            rawValue: rawTrends[1] || 0,
            description: '核心开发者变动风险（0-1范围，0表示无风险）',
            unit: '',
            format: (v) => v === 0 ? '无风险' : `风险指数: ${v.toFixed(2)}`,
            min: 0,
            max: 1,
            isPositive: false
        },
        { // 贡献者增长
            name: '贡献者增长',
            rawValue: rawTrends[2] || 0,
            description: '新贡献者加入的增长情况',
            unit: '%',
            format: (v) => `${(v * 100).toFixed(1)}%`,
            min: -1,
            max: 1,
            isPositive: true
        },
        { // 问题响应趋势
            name: '问题响应趋势',
            rawValue: rawTrends[3] || 0,
            description: 'Issue和PR响应时间的变化（负值表示改善）',
            unit: '%',
            format: (v) => v < 0 ? `-${(Math.abs(v) * 100).toFixed(1)}%` : ` ${(v * 100).toFixed(1)}%`,
            min: -1,
            max: 1,
            isPositive: false 
        },
        { // OpenRank趋势
            name: 'OpenRank趋势',
            rawValue: rawTrends[4] || 0,
            description: '项目在开源生态中的影响力变化',
            unit: '%',
            format: (v) => `${(v * 100).toFixed(1)}%`,
            min: -0.5,
            max: 1.5,
            isPositive: true
        },
        { // 参与者趋势
            name: '参与者趋势',
            rawValue: rawTrends[5] || 0,
            description: '社区参与者的增长情况',
            unit: '%',
            format: (v) => `${(v * 100).toFixed(1)}%`,
            min: -0.5,
            max: 1,
            isPositive: true
        }
    ];
    
    const result = {
        monthlyActivity: ensureSixMonthsData(detailedData.activity || [], false),
        monthlyPotential: [],
        currentPotential: apiData.potential,
        rawTrends: rawTrends,
        dimensions: [...rawTrends],
        dimensionNames: ['活动趋势', '核心贡献者风险', '贡献者增长', '问题响应趋势', 'OpenRank趋势', '参与者趋势'],
        trendConfigs: trendConfigs,  // 确保有trendConfigs
        detailedData: detailedData
    };
    
    // 生成月度潜力数据
    if (result.currentPotential > 0) {
        result.monthlyPotential = generateMonthlyPotentialTrend(result.currentPotential, result.monthlyActivity);
    } else {
        result.monthlyPotential = [60, 62, 65, 68, 70, 72];
    }
    
    console.log('=== adaptBackendData 完成 ===');
    console.log('返回的result:', result);
    
    return result;
}



