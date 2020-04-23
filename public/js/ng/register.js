var app = angular.module('mbApp', []);

app.controller('registration', ($scope, $http, $window, $filter) => {
	//duplicate email alert
	$scope.duplicateEmail = false;

	$scope.registerUserForm = () => {
		//clear before sending
		$scope.duplicateEmail = false;

		$http.post('/register', $scope.user).then((response) => {
			var result = response.data;
			if (result.error !== "" && typeof result.error.code !== 'undefined') {
				if (result.error.code == 'ER_DUP_ENTRY') {
					$scope.duplicateEmail = true;
				}
			}

			//success user creation
			if (result.result !== "") {
				$window.location.href = '/login?stat=1';
			}
		});
	};
});