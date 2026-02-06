import { ref } from 'vue'

export interface Technique {
  title: string
  description: string
}

export interface TechniquesData {
  techniques: Record<string, Technique>
}

const techniques = ref<Record<string, Technique>>({})
const loaded = ref(false)

export function useTechniques() {
  async function loadTechniques(): Promise<void> {
    if (loaded.value) return

    try {
      const response = await fetch('/techniques.json')
      const data: TechniquesData = await response.json()
      techniques.value = data.techniques
      loaded.value = true
    } catch (error) {
      console.error('Failed to load techniques:', error)
    }
  }

  function findTechnique(text: string): { keyword: string; technique: Technique } | null {
    const lowerText = text.toLowerCase()

    // Sort by keyword length (longest first) to match "warm to 43°C" before "warm"
    const sortedKeywords = Object.keys(techniques.value).sort((a, b) => b.length - a.length)

    for (const keyword of sortedKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return { keyword, technique: techniques.value[keyword] }
      }
    }
    return null
  }

  function parseTextWithTechniques(text: string): Array<{ type: 'text' | 'technique'; content: string; technique?: Technique }> {
    const result: Array<{ type: 'text' | 'technique'; content: string; technique?: Technique }> = []
    let remaining = text

    // Sort keywords by length (longest first)
    const sortedKeywords = Object.keys(techniques.value).sort((a, b) => b.length - a.length)

    while (remaining.length > 0) {
      let foundMatch = false

      for (const keyword of sortedKeywords) {
        const lowerRemaining = remaining.toLowerCase()
        const lowerKeyword = keyword.toLowerCase()
        const index = lowerRemaining.indexOf(lowerKeyword)

        if (index !== -1) {
          // Add text before the keyword
          if (index > 0) {
            result.push({ type: 'text', content: remaining.slice(0, index) })
          }

          // Add the keyword with technique
          const actualKeyword = remaining.slice(index, index + keyword.length)
          result.push({
            type: 'technique',
            content: actualKeyword,
            technique: techniques.value[keyword]
          })

          remaining = remaining.slice(index + keyword.length)
          foundMatch = true
          break
        }
      }

      if (!foundMatch) {
        // No more keywords found, add remaining text
        result.push({ type: 'text', content: remaining })
        break
      }
    }

    return result
  }

  return {
    techniques,
    loaded,
    loadTechniques,
    findTechnique,
    parseTextWithTechniques
  }
}
