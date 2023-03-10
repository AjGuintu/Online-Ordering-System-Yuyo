import React from 'react'
import { Alert } from 'react-bootstrap'

const MessageBox = ({ variant, children }) => {
  return <Alert variant={variant}>{children}</Alert>
}

MessageBox.defaultProps = {
  variant: 'info',
}

export default MessageBox