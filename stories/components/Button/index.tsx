import * as React from 'react';

export interface PageProps {
  chart: any[];
}

export interface PageState {
  zoom: number;
  rotation: number;
  center: number[];
}

class Button extends React.Component<PageProps, PageState> {
  constructor(props: PageProps, context: any) {
    super(props, context);
  }

  componentDidMount() {
  }

  componentWillReceiveProps() {}

  render() {
    const { children } = this.props;
    console.log(children);
    return (<button>
      { children }
    </button>);
  }
}

export default Button;
