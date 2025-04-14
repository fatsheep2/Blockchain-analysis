import html2canvas from 'html2canvas'

export const captureScreenshot = async (element, type, address) => {
  try {
    if (!element) return

    // 显示加载提示
    const loading = document.createElement('div')
    loading.className = 'screenshot-loading'
    loading.innerHTML = '正在生成截图...'
    document.body.appendChild(loading)

    // 创建截图
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
      foreignObjectRendering: true,
      height: element.scrollHeight,
      windowHeight: element.scrollHeight,
      scrollY: -window.scrollY,
      onclone: (clonedDoc) => {
        // 确保克隆的文档中包含所有样式
        const style = clonedDoc.createElement('style')
        style.textContent = `
          .address-analysis {
            background-color: #f8fafc;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            min-height: 100vh;
            padding: 20px;
          }
          .screenshot-btn, .screenshot-options {
            display: none;
          }
        `
        clonedDoc.head.appendChild(style)
      }
    })

    if (type === 'clipboard') {
      // 复制到剪贴板
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const item = new ClipboardItem({ 'image/png': blob })
      await navigator.clipboard.write([item])
      alert('截图已复制到剪贴板')
    } else {
      // 保存到本地
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `区块链地址分析_${address.slice(0, 6)}...${address.slice(-4)}.png`
      link.click()
      URL.revokeObjectURL(link.href)
    }
  } catch (error) {
    console.error('截图失败:', error)
    alert('截图失败，请重试')
  } finally {
    const loading = document.querySelector('.screenshot-loading')
    if (loading) {
      document.body.removeChild(loading)
    }
  }
} 