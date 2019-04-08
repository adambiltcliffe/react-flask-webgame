import React from 'react';

function Card(props) {
  let n = props.value
  let cssClass = n == "?" ? "card-unknown" : "card-" + n
  return <span className="card-container">
            <span className={cssClass}>{n}</span>
            {/*<div className="card-popup">
              <div><button>Hi!</button></div>
              <div><button>Hola!</button></div>
            </div>*/}
          </span>
}

export default Card;
