function sleep(sec: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, sec * 1000)
  })
}

export function initiatePayment() {
  return sleep(2)
}

export function ship() {
  return sleep(5)
}

export async function sendShipmentNotification() {
  await sleep(1)
}
