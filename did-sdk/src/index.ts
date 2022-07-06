import axios from 'axios'

export class DidTool {
  static async resolve(url: string) {
    const result = await axios.get(url)
    return result
  }
}
