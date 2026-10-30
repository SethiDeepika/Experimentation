'use client'

import { startTransition, useActionState } from 'react'

// Like useActionState, but submits through onSubmit so React doesn't reset the
// form's fields when the server returns a validation error.
export default function useFormAction(serverAction) {
  const [state, dispatch, pending] = useActionState(serverAction, null)
  const onSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => dispatch(formData))
  }
  return [state, onSubmit, pending]
}
