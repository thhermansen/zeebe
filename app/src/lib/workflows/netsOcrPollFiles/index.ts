import Workflow from '@workflows/workflow'
import {sleep} from 'lib/helpers/sleep'

export default class NetsOcrPollFiles extends Workflow {
  static workflowId = 'netsOcrPollFiles'

  static work() {
    this.client.createWorker<{numberOfFiles: number}>('getListOfOcrFiles', async (job, complete) => {
      this.logger.info(`WORKING ON getListOfOcrFiles. Will generate ${job.variables.numberOfFiles} files`)

      const {numberOfFiles} = job.variables
      const fileNames: string[] = []

      for (let i = 0; i < numberOfFiles; i++) {
        fileNames.push(`ocr-${i}.txt`)
      }

      complete.success({fileNames, newFiles: fileNames.length > 0})
    })

    this.client.createWorker(
      'copyFiles',
      async (job, complete) => {
        const {loopCounter, fileName} = job.variables
        const fileUrl = `s3://some.bucket/ocr/${fileName}`

        this.logger.info(`WORKING ON copyFiles ${loopCounter}, ${fileName}`)

        await sleep(3)

        if (loopCounter === 5) {
          this.logger.error(`Domain error on ${loopCounter}, ${fileName}`)
          complete.error(
            'fileNoLongerExists',
            'File does not exist on SFTP any more, which is ..well, strange, but  .. somehow expected too?'
          )
          return
        }

        if (loopCounter === 6) {
          this.logger.error(`Failure on ${loopCounter}, ${fileName}`)
          complete.failure('Network connection lost')
          return
        }

        if (loopCounter === 7) {
          this.logger.error(`Throw on ${loopCounter}, ${fileName}`)
          throw new Error('Ups')
        }

        this.logger.info(`  --> DONE ON copyFiles ${loopCounter}, ${fileName}`)
        complete.success({fileUrl})
      },
      {
        maxJobsToActivate: 2, // Just to test it out
      }
    )
  }
}
