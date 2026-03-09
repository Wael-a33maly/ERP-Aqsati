// Safe Storage - التعامل الآمن مع localStorage و sessionStorage
// Handles sandboxed iframes that don't allow localStorage access

const isStorageAvailable = (type: 'localStorage' | 'sessionStorage'): boolean => {
  try {
    if (typeof window === 'undefined') return false
    const storage = window[type]
    const testKey = '__storage_test__'
    storage.setItem(testKey, testKey)
    storage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}

// Memory fallback for sandboxed environments
const memoryStorage: Map<string, string> = new Map()

class SafeStorage {
  private storage: Storage | null = null
  private available = false
  private type: 'localStorage' | 'sessionStorage'

  constructor(type: 'localStorage' | 'sessionStorage') {
    this.type = type
    if (typeof window !== 'undefined') {
      this.available = isStorageAvailable(type)
      if (this.available) {
        this.storage = window[type]
      }
    }
  }

  getItem(key: string): string | null {
    try {
      if (this.available && this.storage) {
        return this.storage.getItem(key)
      }
      return memoryStorage.get(key) || null
    } catch (e) {
      return memoryStorage.get(key) || null
    }
  }

  setItem(key: string, value: string): void {
    try {
      if (this.available && this.storage) {
        this.storage.setItem(key, value)
      }
      memoryStorage.set(key, value)
    } catch (e) {
      memoryStorage.set(key, value)
    }
  }

  removeItem(key: string): void {
    try {
      if (this.available && this.storage) {
        this.storage.removeItem(key)
      }
      memoryStorage.delete(key)
    } catch (e) {
      memoryStorage.delete(key)
    }
  }

  clear(): void {
    try {
      if (this.available && this.storage) {
        this.storage.clear()
      }
      memoryStorage.clear()
    } catch (e) {
      memoryStorage.clear()
    }
  }

  get length(): number {
    try {
      if (this.available && this.storage) {
        return this.storage.length
      }
      return memoryStorage.size
    } catch (e) {
      return memoryStorage.size
    }
  }

  key(index: number): string | null {
    try {
      if (this.available && this.storage) {
        return this.storage.key(index)
      }
      const keys = Array.from(memoryStorage.keys())
      return keys[index] || null
    } catch (e) {
      return null
    }
  }
}

// Export singleton instances
export const safeLocalStorage = new SafeStorage('localStorage')
export const safeSessionStorage = new SafeStorage('sessionStorage')

// Helper functions for JSON storage
export const getJSON = <T>(key: string, defaultValue: T): T => {
  try {
    const item = safeLocalStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (e) {
    return defaultValue
  }
}

export const setJSON = <T>(key: string, value: T): void => {
  try {
    safeLocalStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    // Ignore
  }
}

export const removeJSON = (key: string): void => {
  safeLocalStorage.removeItem(key)
}
