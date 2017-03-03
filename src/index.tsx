import * as React from 'react';
import * as ECharts from 'echarts';
import elementResizeEvent = require('element-resize-event');

export interface IReactEChartsProps {
  /**
   * React ECharts instance name
   * Using for identify with chart will be handle the events.
   */
  name: string;

  /**
   * Lable translation when no data
   */
  noDataLabel?: string;

  /**
   * Class name for the React ECharts container
   */
  className?: string;

  /**
   * ECharts theme
   */
  theme?: string;

  /**
   * Speical styles for React ECharts container
   */
  style?: {};

  /**
   * ECharts option
   * See http://echarts.baidu.com/option.html
   */
  option: ECharts.EChartOption;

  /**
   * Enable the option will makes option always merged with previous.
   * Default: false
   */
  notMerge?: boolean;

  /**
   * Redraw after setOption.
   * Default: false
   */
  lazyUpdate?: boolean;

  /**
   * Handler for chart ready
   */
  onChartReady?: (target: any) => {};

  /**
   * Display the is loading indicate.
   * Default: false
   */
  isLoading?: boolean;

  /**
   * ECharts events handlers
   * See: http://echarts.baidu.com/api.html#events
   */
  onEvents?: {
    [actionName: string]: (params?: any, target?: any) => void;
  };

  /**
   * Trigger for React ECharts actions, It's useful with Redux.
   * See: http://echarts.baidu.com/api.html#action
   */
  action?: {
    targets: string[];
    args: {};
  };
}

class ReactECharts extends React.Component<IReactEChartsProps, void> {

  public static defaultProps = {
    noDataLabel: '暂无数据',
  };

  public refs: {
    dom: HTMLCanvasElement;
  };

  public componentDidMount() {
    const target = this.renderEchartDom();
    this.bindEvents(target, this.props);

    if (typeof this.props.onChartReady === 'function') {
      this.props.onChartReady(target);
    }
  }

  public componentWillReceiveProps(nextProps: IReactEChartsProps) {
    // ECharts actions
    if (nextProps.action) {
      if (nextProps.action.targets.indexOf(this.props.name) < 0) {
        return;
      }
      const target = this.getEchartsInstance();
      target.dispatchAction(nextProps.action.args);
      return;
    }

    if (this.refs.dom) {
      ECharts.dispose(this.refs.dom);
    }
    const target = this.renderEchartDom();
    this.bindEvents(target, nextProps);
  }

  public componentDidUpdate() {
    this.renderEchartDom();
  }

  public componentWillUnmount() {
    ECharts.dispose(this.refs.dom);
  }

  public render() {
    const { className } = this.props;
    const style = this.props.style || { height: '100%' };
    return (
      <div ref="dom" className={ className } style={ style }></div>
    );
  }

  private isEmptyData() {
    if (this.props.isLoading) {
      return false;
    }
    if (!Object.keys(this.props.option).length) {
      return true;
    }
    if (!this.props.option.series.length) {
      return true;
    }
    return false;
  }

  private bindEvents(target: any, props: IReactEChartsProps) {
    const onEvents = props.onEvents || {};
    Object
      .keys(onEvents)
      .filter((eventName) => {
        return typeof eventName === 'string' && typeof onEvents[eventName] === 'function';
      }).forEach((eventName) => {
        target.on(eventName, (param: any) => {
          onEvents[eventName](param, target);
        });
    });

    elementResizeEvent(this.refs.dom, () => {
      target.resize();
    });
  }

  private getEchartsInstance() {
    return ECharts.getInstanceByDom(this.refs.dom) || ECharts.init(this.refs.dom, this.props.theme);
  }

  private renderEchartDom() {
    // init the echart object
    const target = this.getEchartsInstance();
    // set the echart option
    let opt = {...this.props.option};
    if (this.isEmptyData()) {
      opt = {
        ...opt,
        graphic: [
          {
            type: 'rect',
            left: 0,
            right: '100%',
            top: 0,
            bottom: '100%',
            visible: true,
            style: {
              fill: '#000',
            },
          },
          {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              fill: '#777',
              font: 'bolder 2em "Microsoft YaHei", "STHeiti", sans-serif',
              silent: true,
              text: this.props.noDataLabel,
              z: 100,
            },
          },
        ],
      };
      const geo = opt.geo as any;
      if (geo) {
        geo.silent = true;
      }
    }
    target.setOption(opt, this.props.notMerge || false, this.props.lazyUpdate || false);
    if (this.props.isLoading) {
      target.showLoading();
    } else {
      target.hideLoading();
    }
    return target;
  }
}

export default ReactECharts;
