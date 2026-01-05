/**
 * 初始化活动数据柱状图
 * @param {HTMLElement} container - 图表容器元素
 * @param {Array} activityData - 活动数据数组（纯数值数组，如[11.74, 11.96, ...]）
 * @param {Array} xAxisLabels - x轴标签数组（时间轴数据）
 */
function initActivityBarChart(container, activityData, xAxisLabels) {
    // 初始化ECharts实例
    const myChart = echarts.init(container);

    // 图表配置
    const option = {
        title: {
            text: '仓库活动趋势',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: xAxisLabels,  // 使用外部传入的时间轴
            axisLabel: {
                rotate: 45,
                interval: 0
            }
        },
        yAxis: {
            type: 'value',
            name: '活动量'
        },
        series: [
            {
                name: '活动数据',
                type: 'bar',
                data: activityData,  // 直接使用纯数值数组
                itemStyle: {
                    color: '#4CAF50'
                },
                emphasis: {
                    itemStyle: {
                        color: '#2E7D32'
                    }
                }
            }
        ]
    };

    myChart.setOption(option);

    // 响应窗口大小变化
    window.addEventListener('resize', () => {
        myChart.resize();
    });

    return myChart;
}