
  /*******************************************************************
  * Users.js
  * Generated by Backendless Corp.
  ********************************************************************/
		
   const Utils = {
    isObject : obj => obj === Object(obj),
    isString : obj => Object.prototype.toString.call(obj).slice(8, -1) === 'String',
    isNumber : obj => Object.prototype.toString.call(obj).slice(8, -1) === 'Number',
    isBoolean: obj => Object.prototype.toString.call(obj).slice(8, -1) === 'Boolean',
    isDate   : obj => Object.prototype.toString.call(obj).slice(8, -1) === 'Date'
  }
  
  Backendless.APIServices.Users = {
    signupUser(userInfo) {   
      if (!Utils.isObject(userInfo)) {
        throw new Error('Invalid value for argument "userInfo". Must be object value')
      }
      
      const args = userInfo
      return Backendless.APIServices.invoke('Users', 'signupUser', args)
    },
  
    getFollowingUsers(userId) {   
      if (!Utils.isString(userId)) {
        throw new Error('Invalid value for argument "userId". Must be string value')
      }
      
      const args = userId
      return Backendless.APIServices.invoke('Users', 'getFollowingUsers', args)
    },
  
    getFollowedUsers(userId) {   
      if (!Utils.isString(userId)) {
        throw new Error('Invalid value for argument "userId". Must be string value')
      }
      
      const args = userId
      return Backendless.APIServices.invoke('Users', 'getFollowedUsers', args)
    },
  
    followUser(userId) {   
      if (!Utils.isString(userId)) {
        throw new Error('Invalid value for argument "userId". Must be string value')
      }
      
      const args = userId
      return Backendless.APIServices.invoke('Users', 'followUser', args)
    },
  
    unfollowUser(userId) {   
      if (!Utils.isString(userId)) {
        throw new Error('Invalid value for argument "userId". Must be string value')
      }
      
      const args = userId
      return Backendless.APIServices.invoke('Users', 'unfollowUser', args)
    },
  
    getSuggestedUsers() { 
      const args = null
        
      return Backendless.APIServices.invoke('Users', 'getSuggestedUsers', args)
    },
  
    getAllUsers(filter) {   
      if (!Utils.isObject(filter)) {
        throw new Error('Invalid value for argument "filter". Must be object value')
      }
      
      const args = filter
      return Backendless.APIServices.invoke('Users', 'getAllUsers', args)
    },
  
    getSingleUser(username) {   
      if (!Utils.isString(username)) {
        throw new Error('Invalid value for argument "username". Must be string value')
      }
      
      const args = username
      return Backendless.APIServices.invoke('Users', 'getSingleUser', args)
    },
  
    getCurrentUser() { 
      const args = null
        
      return Backendless.APIServices.invoke('Users', 'getCurrentUser', args)
    },
  
    editUser(updatedUser) {   
      if (!Utils.isObject(updatedUser)) {
        throw new Error('Invalid value for argument "updatedUser". Must be object value')
      }
      
      const args = updatedUser
      return Backendless.APIServices.invoke('Users', 'editUser', args)
    }
  }
  