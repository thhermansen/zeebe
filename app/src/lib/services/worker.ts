import OrderWorkflow from '@workflows/orderPlaced'
import NetsOcrRegistration from '@workflows/netsOcrRegistration'
import NetsOcrPollFiles from '@workflows/netsOcrPollFiles'
import NetsOcrProcessFile from '@workflows/netsOcrProcessFile'

async function main() {
  if (await OrderWorkflow.deploy()) OrderWorkflow.work()
  if (await NetsOcrRegistration.deploy()) NetsOcrRegistration.work()
  if (await NetsOcrPollFiles.deploy()) NetsOcrPollFiles.work()
  if (await NetsOcrProcessFile.deploy()) NetsOcrProcessFile.work()
}

main()
