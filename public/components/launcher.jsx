import React from 'react'
import { Link } from 'react-router'

export default class Launcher extends React.Component {
  render () {
    return (
      <div className='launcher'>
        <ul>
          <li><Link to='/'>Apps</Link></li>
          <li><Link to='/activities'>Activities</Link></li>
          <li><Link to='/plugins'>Plugins</Link></li>
          <li><Link to='/uninstall'>Uninstall</Link></li>
          <li><Link to='/settings'>Settings</Link></li>
        </ul>
      </div>
    )
  }
}