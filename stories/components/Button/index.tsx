import * as React from 'react';

export interface PageProps {}

export interface PageState {}

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
