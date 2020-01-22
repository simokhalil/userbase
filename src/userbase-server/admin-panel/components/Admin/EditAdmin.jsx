import React, { Component } from 'react'
import { func, string } from 'prop-types'
import adminLogic from './logic'
import UnknownError from './UnknownError'

export default class EditAdmin extends Component {
  constructor(props) {
    super(props)
    this.state = {
      email: '',
      fullName: '',
      password: '',
      loadingUpdateAdmin: false,
      loadingDeleteAdmin: false,
      loadingCheckout: false,
      loadingCancel: false,
      loadingUpdatePaymentMethod: false,
      loadingResumeSubscription: false,
      errorUpdatingAdmin: '',
      errorDeletingAdmin: '',
      errorCheckingOut: false,
      errorCancelling: false,
      errorUpdatingPaymentMethod: false,
      errorResumingSubscription: false
    }

    this.handleInputChange = this.handleInputChange.bind(this)
    this.handleUpdateAcount = this.handleUpdateAcount.bind(this)
    this.handleDeleteAccount = this.handleDeleteAccount.bind(this)
    this.handleCancelSubscription = this.handleCancelSubscription.bind(this)
    this.handleResumeSubscription = this.handleResumeSubscription.bind(this)
    this.handleCheckout = this.handleCheckout.bind(this)
    this.handleUpdatePaymentMethod = this.handleUpdatePaymentMethod.bind(this)
  }

  async componentDidMount() {
    this._isMounted = true
    document.addEventListener('keydown', this.handleHitEnter, true)
  }

  componentWillUnmount() {
    this._isMounted = false
    document.removeEventListener('keydown', this.handleHitEnter, true)
  }

  handleHitEnter(e) {
    const ENTER_KEY_CODE = 13
    if ((e.target.name === 'email' || e.target.name === 'password' || e.target.name === 'fullName') &&
      (e.key === 'Enter' || e.keyCode === ENTER_KEY_CODE)) {
      e.stopPropagation()
    }
  }

  handleInputChange(event) {
    if (this.state.errorUpdatingAdmin || this.state.errorDeletingAdmin) {
      this.setState({ errorUpdatingAdmin: undefined, errorDeletingAdmin: undefined })
    }

    const target = event.target
    const value = target.value
    const name = target.name

    this.setState({
      [name]: value
    })
  }

  async handleUpdateAcount(event) {
    const { email, password, fullName } = this.state
    event.preventDefault()

    if (!email && !password && !fullName) return

    this.setState({ loadingUpdateAdmin: true })

    try {
      await adminLogic.updateAdmin({ email, password, fullName })
      if (email || fullName) this.props.handleUpdateAccount(email, fullName)
      if (this._isMounted) this.setState({ email: '', password: '', fullName: '', loadingUpdateAdmin: false })
    } catch (e) {
      if (this._isMounted) this.setState({ errorUpdatingAdmin: e.message, loadingUpdateAdmin: false })
    }
  }

  async handleDeleteAccount(event) {
    event.preventDefault()

    this.setState({ errorDeletingAdmin: '' })

    try {
      if (window.confirm('Are you sure you want to delete your account?')) {
        this.setState({ loadingDeleteAdmin: true })
        await adminLogic.deleteAdmin()
      }
    } catch (e) {
      if (this._isMounted) this.setState({ errorDeletingAdmin: e.message, loadingDeleteAdmin: false })
    }
  }

  async handleCheckout(event) {
    event.preventDefault()

    this.setState({ loadingCheckout: true, errorCheckingOut: false })
    try {
      await adminLogic.subscribeToSaas()
      if (this._isMounted) this.setState({ loadingCheckout: false })
    } catch (e) {
      if (this._isMounted) this.setState({ loadingCheckout: false, errorCheckingOut: true })
    }
  }

  async handleUpdatePaymentMethod(event) {
    event.preventDefault()

    if (this.state.loadingUpdatePaymentMethod) return

    this.setState({ loadingUpdatePaymentMethod: true, errorUpdatingPaymentMethod: false, errorCancelling: false })
    try {
      await adminLogic.updateSaasPaymentMethod()

      if (this._isMounted) this.setState({ loadingUpdatePaymentMethod: false })
    } catch (e) {
      if (this._isMounted) this.setState({ loadingUpdatePaymentMethod: false, errorUpdatingPaymentMethod: true })
    }
  }

  async handleCancelSubscription(event) {
    event.preventDefault()

    if (this.state.loadingCancel) return

    this.setState({ errorCancelling: false, errorUpdatingPaymentMethod: false })

    try {
      if (window.confirm('Are you sure you want to cancel your subscription?')) {
        this.setState({ loadingCancel: true })
        const paymentStatus = await adminLogic.cancelSaasSubscription()

        this.props.handleUpdatePaymentStatus(paymentStatus)

        if (this._isMounted) this.setState({ loadingCancel: false })
      }
    } catch (e) {
      if (this._isMounted) this.setState({ loadingCancel: false, errorCancelling: true })
    }
  }

  async handleResumeSubscription(event) {
    event.preventDefault()

    try {
      this.setState({ loadingResumeSubscription: true, errorResumingSubscription: false })

      await adminLogic.resumeSaasSubscription()
      const paymentStatus = await adminLogic.getPaymentStatus()

      this.props.handleUpdatePaymentStatus(paymentStatus)

      if (this._isMounted) this.setState({ loadingResumeSubscription: false })
    } catch (e) {
      if (this._isMounted) this.setState({ loadingResumeSubscription: false, errorResumingSubscription: true })
    }
  }

  render() {
    const { paymentStatus } = this.props
    const {
      fullName,
      email,
      password,
      loadingUpdateAdmin,
      loadingDeleteAdmin,
      loadingCheckout,
      loadingCancel,
      loadingUpdatePaymentMethod,
      loadingResumeSubscription,
      errorUpdatingAdmin,
      errorDeletingAdmin,
      errorCheckingOut,
      errorCancelling,
      errorUpdatingPaymentMethod,
      errorResumingSubscription,
      loading
    } = this.state

    return (
      <div className='container content text-xs xs:text-base text-center mb-8'>

        {loading
          ? <div className='loader inline-block w-6 h-6' />
          : paymentStatus === 'active' || paymentStatus === 'past_due'
            ?
            <div>
              <input
                className='btn w-56 text-center'
                type='button'
                role='link'
                value={loadingUpdatePaymentMethod ? 'Loading...' : 'Update Payment Method'}
                disabled={loadingCancel || loadingUpdatePaymentMethod}
                onClick={this.handleUpdatePaymentMethod}
              />

              <br />
              <br />

              <input
                className='btn w-56 text-center'
                type='button'
                role='link'
                value={loadingCancel ? 'Cancelling Subscription...' : 'Cancel Subscription'}
                disabled={loadingCancel || loadingUpdatePaymentMethod}
                onClick={this.handleCancelSubscription}
              />

              {errorCancelling && <UnknownError action='cancelling your subscription' />}
              {errorUpdatingPaymentMethod && <UnknownError action='loading the form to update your payment method' />}

            </div>
            :
            <div>
              <div className='font-light text-left mb-4'>
                You are currently using the <span className='font-bold'>free</span> version of Userbase.
              </div>

              {paymentStatus === 'cancel_at_period_end'
                ? <input
                  className='btn w-56 text-center'
                  type='button'
                  role='link'
                  value={loadingResumeSubscription ? 'Resuming Subscription...' : 'Resume Subscription'}
                  disabled={loadingResumeSubscription}
                  onClick={this.handleResumeSubscription}
                />
                : <input
                  className='btn w-56 text-center'
                  type='button'
                  role='link'
                  disabled={loadingCheckout}
                  value={loadingCheckout ? 'Loading...' : 'Purchase Subscription'}
                  onClick={this.handleCheckout}
                />
              }

              {errorCheckingOut && <UnknownError action='loading the checkout form' />}
              {errorResumingSubscription && <UnknownError action='resuming your subscription' />}

            </div>
        }

        <hr className='border border-t-0 border-gray-400 mt-8 mb-4' />

        <form onSubmit={this.handleUpdateAcount}>
          <div className='table'>

            <div className='table-row'>
              <div className='table-cell p-2 text-right'>Full Name</div>
              <div className='table-cell p-2'>
                <input
                  className='font-light text-xs xs:text-sm w-48 sm:w-84 h-8 p-2 border border-gray-500 outline-none'
                  type='text'
                  name='fullName'
                  autoComplete='name'
                  value={fullName}
                  onChange={this.handleInputChange}
                />
              </div>
            </div>

            <div className='table-row'>
              <div className='table-cell p-2 text-right'>Email</div>
              <div className='table-cell p-2'>
                <input
                  className='font-light text-xs xs:text-sm w-48 sm:w-84 h-8 p-2 border border-gray-500 outline-none'
                  type='email'
                  name='email'
                  autoComplete='email'
                  onChange={this.handleInputChange}
                  value={email}
                />
              </div>
            </div>

            <div className='table-row'>
              <div className='table-cell p-2 text-right'>Password</div>
              <div className='table-cell p-2'>
                <input
                  className='font-light text-xs xs:text-sm w-48 sm:w-84 h-8 p-2 border border-gray-500 outline-none'
                  type='password'
                  name='password'
                  autoComplete='new-password'
                  onChange={this.handleInputChange}
                  value={password}
                />
              </div>
            </div>

          </div>


          <div className='text-center'>
            <input
              className='btn w-40 mt-4'
              type='submit'
              value={loadingUpdateAdmin ? 'Updating...' : 'Update Account'}
              disabled={(!fullName && !email && !password) || loadingDeleteAdmin || loadingUpdateAdmin}
            />

            {errorUpdatingAdmin && (
              errorUpdatingAdmin === 'Unknown Error'
                ? <UnknownError action='updating your account' />
                : <div className='error'>{errorUpdatingAdmin}</div>
            )}

          </div>

        </form>

        <hr className='border border-t-0 border-gray-400 mt-8 mb-6' />

        <input
          className='btn w-40'
          type='button'
          value={loadingDeleteAdmin ? 'Deleting...' : 'Delete Account'}
          disabled={loadingDeleteAdmin}
          onClick={this.handleDeleteAccount}
        />

        {errorDeletingAdmin && (
          errorDeletingAdmin === 'Unknown Error'
            ? <UnknownError action='deleting your account' />
            : <div className='error'>{errorDeletingAdmin}</div>
        )}

      </div>
    )
  }
}

EditAdmin.propTypes = {
  handleUpdateAccount: func,
  paymentStatus: string,
  handleUpdatePaymentStatus: func
}
