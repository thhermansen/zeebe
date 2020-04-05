import {ZBClient} from 'zeebe-node'
import * as world from './world'

function workflowLocation(filename: string) {
  return `${__dirname}/${filename}`
}

interface OrderPlacedParams {
  orderId: number
  country: 'Norway' | 'sweden' // Yes, small s on purpose to show error in workflow
}

type ShipValue = 'Bring' | 'Sveriges Post'

interface OrderShippedParams extends OrderPlacedParams {
  estimatedArrival: string
  shippedBy: ShipValue
}

export default class OrderWorkflow {
  static logger = console

  static client = new ZBClient()
  static workflowId = 'orderPlaced'

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
    } catch (error) {
      this.logger.error(`FAILED deploy ${path}`, error)
    }
  }

  /**
   * An order is placed, initiate order process
   */
  static async orderPlaced(params: OrderPlacedParams) {
    try {
      const res = await this.client.createWorkflowInstance<OrderPlacedParams>(this.workflowId, params)
      this.logger.info(this.pretty(res))
    } catch (error) {
      this.logger.error(`FAILED to create instance of ${this.workflowId}`, error)
    }
  }

  /**
   * Start workers
   */
  static async work() {
    /**
     * WORKER: Initiate payment
     */
    this.client.createWorker<OrderPlacedParams>('initiatePayment', async (job, complete) => {
      const orderId = job.variables.orderId

      this.logger.info('initiatePayment begun', this.pretty(job))
      await world.initiatePayment()

      if (orderId % 2 !== 0) {
        this.logger.info(`initiatePayment success`, orderId)
        complete.success()
      } else {
        this.logger.info(`initiatePayment failed`, orderId)
        complete.failure('API error - payment gateway was down')
      }
    })

    /**
     * WORKER: shipNorway
     */
    this.client.createWorker<OrderPlacedParams>('shipNorway', async (job, complete) => {
      this.logger.info('GOT JOB: shipNorway', this.pretty(job))

      await world.ship()

      complete.success({...job.variables, estimatedArrival: '2020-12-31', shippedBy: 'Bring'})
    })

    /**
     * WORKER: shipSweden
     */
    this.client.createWorker<OrderPlacedParams>('shipSweden', async (job, complete) => {
      this.logger.info('GOT JOB: shipSweden', this.pretty(job))

      await world.ship()

      // complete.failure('API not responding')
      complete.error('shipmentTooLarge', 'The shipment was to large for Sweden to handle')
    })

    /**
     * Redirect shipment to given country in header
     */
    this.client.createWorker<OrderPlacedParams, {country: string}>('setCountry', (job, complete) => {
      const country = job.customHeaders.country

      this.logger.info(`GOT JOB: setCountry. Will be set to ${country}`, this.pretty(job))
      this.logger.info()

      complete.success({...job.variables, country})
    })

    /**
     * WORKER: sendShipmentNotification
     */
    this.client.createWorker<OrderShippedParams>('sendShipmentNotification', async (job, complete) => {
      this.logger.info('GOT JOB: sendShipmentNotification', this.pretty(job))

      const {orderId, shippedBy} = job.variables
      await world.sendShipmentNotification()
      this.logger.info(`SENT SHIPPING NOTE of ${orderId}: ${shippedBy}`)

      complete.success()
    })
  }

  private static pretty(obj: any) {
    return JSON.stringify(obj, null, 2)
  }
}
