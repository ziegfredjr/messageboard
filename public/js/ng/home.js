var app = angular.module('mbApp', []);
app.controller('uploadCtrl', ($scope, $http) => {

	$scope.inactive = true;

	$scope.SelectFile = (e) => {
		var reader = new FileReader();
		reader.onload = (e) => {
			$scope.PreviewImage = e.target.result;
			$scope.inactive = false;
			$scope.$apply();
		}
		reader.readAsDataURL(e.target.files[0]);
	};
});