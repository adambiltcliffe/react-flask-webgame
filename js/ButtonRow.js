import React from 'react';

class ButtonRow extends React.Component {
  render() {
    // probably bad
    if (typeof this.props.moves == 'undefined')
    {
      return null
    }
    const buttons = this.props.moves.map((moveName) => <button>{moveName}</button>)
    return (<div>
              {buttons}
            </div>);
  }
};

export default ButtonRow;
