// Mock lowdb to avoid ESM parsing issues in Jest
class LowSync {
  constructor(adapter, options = {}) {
    this.adapter = adapter
    this.data = options.defaultData || {}
  }

  read() {
    return this
  }

  write() {
    return this
  }
}

class JSONFileSync {
  constructor(filename) {
    this.filename = filename
  }

  read() {
    return {}
  }

  write(data) {
    // Mock write
  }
}

module.exports = {
  LowSync,
  JSONFileSync,
}
