import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'

interface Params {
  namespace: string
  dnsDomain: string
}

export default class ZeeBeCluster extends pulumi.ComponentResource {
  private dnsDomain: string
  private namespace: string

  constructor({namespace, dnsDomain}: Params, opts?: pulumi.ComponentResourceOptions) {
    super('workflow-engine', 'zeebe-cluster', {}, opts)
    this.namespace = namespace
    this.dnsDomain = dnsDomain

    const fetchOpts = {
      repo: 'https://helm.zeebe.io',
    }

    const cluster = new k8s.helm.v3.Chart(
      'zeebe-cluster',
      {
        chart: 'zeebe-cluster',
        repo: 'zeebe',
        namespace,
        fetchOpts,
        transformations: [this.removeHelmHooksTransformation, this.fixBadMetadataNameForTestConnection],
      },
      {...opts, parent: this}
    )

    new k8s.helm.v3.Chart(
      'zeebe-operate',
      {
        chart: 'zeebe-operate',
        repo: 'zeebe',
        namespace,
        fetchOpts,
        transformations: [this.removeHelmHooksTransformation, this.addHostToNginxIngress],
        values: {
          global: {
            zeebe: `zeebe-cluster-zeebe`,
          },
        },
      },
      {...opts, dependsOn: cluster, parent: this}
    )
  }

  /**
   * Or else it seems to be available on all unknown hosts for cluster
   */
  private addHostToNginxIngress = (o: any) => {
    if (o.kind === 'Ingress' && o.metadata.labels['app.kubernetes.io/instance'] === 'zeebe-operate') {
      o.spec.rules[0].host = `${this.namespace}-zeebe-operate.${this.dnsDomain}`
    }
  }

  /**
   * Somehow a metadata.name contained {{.Release.Name}}
   */
  private fixBadMetadataNameForTestConnection(o: any) {
    if ((o.metadata.name as string).endsWith('-zeebe-test-connection')) {
      o.metadata.name = `zeebe-cluster-zeebe-test-connection`
    }
  }

  /**
   * Helm comes with some test hooks. We don't want them.
   *
   * @see https://github.com/pulumi/pulumi-kubernetes/issues/666
   * @see https://github.com/pulumi/pulumi-kubernetes/issues/665
   * @see https://github.com/pulumi/pulumi-kubernetes/issues/555
   */
  private removeHelmHooksTransformation(o: any) {
    const annotations = o.metadata?.annotations

    if (annotations && annotations['helm.sh/hook']) {
      for (const key in o) {
        delete o[key]
      }
      Object.assign(o, {
        kind: 'List',
        apiVersion: 'v1',
        metadata: {name: 'skipped-helm-test'},
        items: [],
      })
    }
  }
}
