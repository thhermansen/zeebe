import {sleep} from 'lib/helpers/sleep'

export function initiatePayment() {
  return sleep(2)
}

export function ship() {
  return sleep(5)
}

export async function sendShipmentNotification() {
  await sleep(1)
}
