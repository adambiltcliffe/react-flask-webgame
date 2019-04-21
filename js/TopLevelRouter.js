import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import Application from './Application'

function TopLevelRouter(props) {
  return <BrowserRouter>
            <Application />
          </BrowserRouter>
};

export default TopLevelRouter
