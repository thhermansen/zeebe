// import * as world from './world'
import Workflow from '@workflows/workflow'
import * as world from './world'

interface OcrAgreement {
  accountNumber: number
  state?: 'ACTIVE' | 'PENDING'
}

export default class NetsOcrRegistration extends Workflow {
  static workflowId = 'netsOcrRegistration'

  static async schedule(accountNumber: number) {
    try {
      const res = await this.client.createWorkflowInstance(this.workflowId, {accountNumber})
      this.logger.info(this.pretty(res))
    } catch (error) {
      this.logger.error(`FAILED to create instance of ${this.workflowId}`, error)
    }
  }

  static work() {
    this.client.createWorker<OcrAgreement>('netsOcrAgreementSubmitToNets', async (job, complete) => {
      this.logger.info(`START netsOcrAgreementSubmitToNets ${job.variables.accountNumber}`)

      await world.doStuff()

      this.logger.info(`SUCCESS netsOcrAgreementSubmitToNets ${job.variables.accountNumber}`)
      complete.success()
    })

    this.client.createWorker<OcrAgreement>('netsOcrAgreementPollStatus', async (job, complete) => {
      this.logger.info(`START netsOcrAgreementPollStatus ${job.variables.accountNumber}`)

      await world.doStuff()

      this.logger.info(`SUCCESS netsOcrAgreementPollStatus ${job.variables.accountNumber}`)
      complete.success({...job.variables, ...{state: 'ACTIVE'}})
    })
  }
}
