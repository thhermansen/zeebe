import Workflow from '@workflows/workflow'

interface Transaction {
  sourceOcrUrl: string
  accountNumber: string
  ocrAgreementId: number
  amount: number
}

export default class NetsOcrProcessFile extends Workflow {
  static workflowId = 'netsOcrProcessFile'

  static work() {
    this.client.createWorker<{fileUrl: string; loopCounter: number}, {}, {transactions: Transaction[]}>(
      'netsOcrParseAndFlatMapToTransactions',
      async (job, complete) => {
        this.logger.info(`WORKING ON netsOcrParseAndFlatMapToTransactions. ${job.variables.fileUrl}`)

        const transactions = [
          {
            sourceOcrUrl: job.variables.fileUrl,
            accountNumber: job.variables.loopCounter.toString(),
            ocrAgreementId: job.variables.loopCounter,
            amount: job.variables.loopCounter * 2,
          },
          {
            sourceOcrUrl: job.variables.fileUrl,
            accountNumber: job.variables.loopCounter.toString(),
            ocrAgreementId: job.variables.loopCounter,
            amount: job.variables.loopCounter * 5,
          },
        ]

        this.logger.info(`  --> DONE netsOcrParseAndFlatMapToTransactions. ${job.variables.fileUrl}`)
        complete.success({transactions})
      }
    )

    this.client.createWorker<{transaction: Transaction}>('netsOcrRegisterTransaction', async (job, complete) => {
      this.logger.info(`WORKING ON netsOcrRegisterTransaction. ${this.pretty(job.variables.transaction)}`)

      this.logger.info(`  --> DONE netsOcrRegisterTransaction. ${job.variables.transaction.ocrAgreementId}`)
      complete.success({result: {...job.variables.transaction, ...{status: 'ok'}}})
    })
  }
}
