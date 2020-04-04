import * as pulumi from '@pulumi/pulumi'
import * as k8s from '@pulumi/kubernetes'

import ZeeBeCluster from './zeebe'

const config = new pulumi.Config()
const namespace = config.require('namespace')
const dnsDomain = config.require('dnsDomain')
const kubeconfig = new pulumi.Config('kubernetes').require('kubeconfig')
const provider = new k8s.Provider('cluster', {namespace, kubeconfig})

const ns = new k8s.core.v1.Namespace(namespace, {metadata: {name: namespace}}, {provider})

new ZeeBeCluster({namespace, dnsDomain}, {dependsOn: ns, provider})
