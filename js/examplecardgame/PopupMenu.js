import React from 'react';
import onClickOutside from 'react-onclickoutside'

function PopupMenu(props) {
  PopupMenu.handleClickOutside = props.dismiss
  return (<div className="card-popup">{props.children}</div>)
};

const clickOutsideConfig = {handleClickOutside: () => PopupMenu.handleClickOutside}

export default onClickOutside(PopupMenu, clickOutsideConfig)
