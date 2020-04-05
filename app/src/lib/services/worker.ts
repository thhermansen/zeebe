import OrderWorkflow from '@workflows/order'

async function main() {
  await OrderWorkflow.deploy()
  OrderWorkflow.work()
}

main()
