import '../../styles/picker.less';
import * as React from 'react';
// import styled from 'styled-components';
//
// const Canvas1 = styled.canvas`
//   w
// `;

export interface PageProps {}

export interface PageState {}

class PickerColor extends React.Component<PageProps, PageState> {
  private canvas1: React.RefObject<HTMLCanvasElement>;
  private canvas2: React.RefObject<HTMLCanvasElement>;
  private style: { width: string; height: string };
  constructor(props: PageProps, context: any) {
    super(props, context);

    this.canvas1 = React.createRef();
    this.canvas2 = React.createRef();

    this.style = {
      height: '100vh',
      width: '100vw',
    };
  }

  initCanvas() {}

  initGl() {}

  componentDidMount() {
    if (this.canvas1) {
      this.initCanvas();
    }

    if (this.canvas2) {
      this.initGl();
    }
  }

  componentWillReceiveProps() {}

  render() {
    // const { children } = this.props;
    // @ts-ignore
    return (<div className="view-content" style={this.style}>
      <canvas ref={this.canvas1} className="view-content__left" />
      <canvas ref={this.canvas2} className="view-content__right" />
    </div>);
  }
}

export default PickerColor;
