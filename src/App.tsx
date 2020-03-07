import React, { Fragment } from 'react'
import { HashRouter, Route, Switch } from 'react-router-dom'
import { About } from './pages/About'
import { Home } from './pages/Home'

const App: React.FC = () => {
  return (
    <HashRouter>
      {/* <Navbar /> */}
      <Switch>
        <Fragment>
          <div className="container">
            <Route path="/" component={Home} exact />
            <Route path="/about" component={About} />
          </div>
        </Fragment>
      </Switch>
    </HashRouter>
  )
}

export default App
