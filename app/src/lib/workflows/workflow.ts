import {ZBClient} from 'zeebe-node'

function workflowLocation(filename: string) {
  return `${__dirname}/models/${filename}`
}

/**
 * Look at https://github.com/creditsenseau/zeebe-client-node-js#generating-code-from-a-bpm-model-file as an alternative.
 */
abstract class Workflow {
  static logger = console

  static client = new ZBClient()
  static workflowId: string

  /**
   * Deploys the workflow
   *
   * @param client The client we communicate with ZeeBe via
   */
  static async deploy() {
    const path = workflowLocation(`${this.workflowId}.bpmn`)

    try {
      const res = await this.client.deployWorkflow(path)
      this.logger.info(`DEPLOYED ${path}`, this.pretty(res))
      return true
    } catch (error) {
      this.logger.error(`FAILED deploy ${path}`, error)
      return false
    }
  }

  static work() {
    this.logger.warn(`No workers defined for ${this.workflowId}`)
  }

  protected static pretty(obj: any) {
    return JSON.stringify(obj, null, 2)
  }
}

export default Workflow
