import html2canvas from 'html2canvas'

export async function exportMindMapAsImage(
  elementId: string,
  fileName: string = 'mindmap'
): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`)
    }

    // Get the element's bounding box
    const canvas = await html2canvas(element, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: 2, // Higher resolution
      logging: false,
    })

    // Create download link
    const link = document.createElement('a')
    link.href = canvas.toDataURL('image/png')
    link.download = `${fileName}-${new Date().toISOString().split('T')[0]}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('[v0] Error exporting mindmap:', error)
    throw error
  }
}

export async function copyMindMapToClipboard(elementId: string): Promise<void> {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`)
    }

    const canvas = await html2canvas(element, {
      allowTaint: true,
      useCORS: true,
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
    })

    canvas.toBlob((blob) => {
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob })
        navigator.clipboard.writeText(element.innerText)
      }
    })
  } catch (error) {
    console.error('[v0] Error copying mindmap:', error)
    throw error
  }
}
