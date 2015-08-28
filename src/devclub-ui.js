function DevclubMedal() {
  return {
    restrict: 'E',
    scope: {
      year: '=',
      place: '='
    },
    templateUrl: 'devclub-medal.html'
  };
}

function DevclubUser() {
  return {
    restrict: 'E',
    scope: {
      member: '='
    },
    templateUrl: 'devclub-user.html'
  };
}

angular.module('devclub').directive('medal', DevclubMedal);
angular.module('devclub').directive('user', DevclubUser);