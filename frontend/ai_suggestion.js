// AI建议相关元素
const aiSuggestBtn = document.getElementById('aiSuggestBtn');
const aiLoading = document.getElementById('aiLoading');
const aiSuggestContainer = document.getElementById('aiSuggestContainer');
const aiSuggestContent = document.getElementById('aiSuggestContent');

// AI建议按钮点击事件
aiSuggestBtn.addEventListener('click', async () => {
    const repo = repoInput.value.trim();
    if (!repo || !repo.includes('/')) {
        errorMsg.textContent = '请先输入正确格式的仓库地址（格式: owner/repo）';
        return;
    }

    // 重置AI建议区域状态
    errorMsg.textContent = '';
    aiSuggestContainer.style.display = 'none';
    aiLoading.style.display = 'block';
    aiSuggestBtn.disabled = true;

    try {
        // 调用AI建议接口
        const response = await fetch('http://localhost:5000/ai-suggest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ repo: repo })
        });

        const aiData = await response.json();

        if (!response.ok) {
            throw new Error(aiData.error || 'AI建议生成失败，请重试');
        }

        // 核心修改：用marked()将MD格式转为HTML，再用innerHTML插入
        const mdContent = aiData.suggestion || '暂无有效建议';
        const htmlContent = marked.parse(mdContent); // MD转HTML
        aiSuggestContent.innerHTML = htmlContent; // 替换原来的textContent
        aiSuggestContainer.style.display = 'block';

    } catch (err) {
        errorMsg.textContent = err.message;
    } finally {
        aiLoading.style.display = 'none';
        aiSuggestBtn.disabled = false;
    }
});