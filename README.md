# Prerequisite

- brew cask install zeebe-modeler

# Example app

```bash
kubectl port-forward svc/zeebe-cluster-zeebe-gateway 26500:26500 -n zeebe-thorbjorn # Run in a terminal of it's own

cd app

bin/worker # Run in a terminal of it's own
bin/console
```

## Order

```ts
import {Duration} from 'zeebe-node'
import OrderWorkflow from '@workflows/orderPlaced'

// Will be a success :-)
let orderId = 1
OrderWorkflow.orderPlaced({orderId, country: 'Norway'})
OrderWorkflow.client.publishMessage({ name: 'paymentReceived', correlationKey: orderId.toString(), timeToLive: Duration.seconds.of(60), variables: {receivedAmount: 100} })

// Will fail, payment issue
orderId = 2
OrderWorkflow.orderPlaced({orderId, country: 'Norway'})

// Change order id to 3, just to make it pass
OrderWorkflow.client.publishMessage({ name: 'paymentReceived', correlationKey: '3', timeToLive: Duration.seconds.of(60), variables: {receivedAmount: 100} })

// Show business error, sending is too large
orderId = 5
OrderWorkflow.orderPlaced({orderId, country: 'sweden'})
OrderWorkflow.client.publishMessage({ name: 'paymentReceived', correlationKey: orderId.toString(), timeToLive: Duration.seconds.of(60), variables: {receivedAmount: 100} })
```

## OCR registration

```ts
import {Duration} from 'zeebe-node'
import NetsOcrRegistration from '@workflows/netsOcrRegistration'

let accountNumber = 1
NetsOcrRegistration.schedule(accountNumber)

NetsOcrRegistration.client.publishMessage({name: 'netsOcrAgreementPollStatusNow', correlationKey: accountNumber.toString(), timeToLive: Duration.seconds.of(60), variables: {} })
```

## OCR Poll

```ts
import {Duration} from 'zeebe-node'
import NetsOcrPollFiles from '@workflows/netsOcrPollFiles'

NetsOcrPollFiles.client.publishMessage({name: 'netsOcrPollFilesStart', correlationKey: 'pollJobSameKeyEnsuresSingleInstance', timeToLive: Duration.seconds.of(60), variables: {numberOfFiles: 0} })

NetsOcrPollFiles.client.publishMessage({name: 'netsOcrPollFilesStart', correlationKey: 'pollJobSameKeyEnsuresSingleInstance', timeToLive: Duration.seconds.of(60), variables: {numberOfFiles: 2} })

// File number 5, 6 and 7 will cause issue in parent process
NetsOcrPollFiles.client.publishMessage({name: 'netsOcrPollFilesStart', correlationKey: 'pollJobSameKeyEnsuresSingleInstance', timeToLive: Duration.seconds.of(60), variables: {numberOfFiles: 7} })

```

# Resources

- [What is Zeebe?](https://docs.zeebe.io/introduction/what-is-zeebe.html)
- [Getting started](https://docs.zeebe.io/getting-started/index.html)
- [Typescript client](http://zeebe.joshwulf.com/introduction/)
  - [Github](https://github.com/creditsenseau/)

# TODO

- [x] HELM charts has some tests running, which .. I'm not sure how is suppose to work, but I do want to not include them in the deploy.
  - [x] Seems like someone already is working on this here: https://github.com/pulumi/pulumi-kubernetes/pull/666
- [x] Make a test app to play with
- [ ] Test more advanced use cases like subprocesses, errro handling etc.


# Questions

- How to show history to users?
  - https://docs.zeebe.io/basics/exporters.html
  - https://github.com/zeebe-io/zeebe/tree/master/exporters/elasticsearch-exporter
- How does it really work in production?
  - https://zeebe.io/cloud/


