/*
 * Copyright (c) 2010-2021 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-FileCopyrightText: 2010-2021 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 * SPDX-License-Identifier: EPL-2.0
 */
let importView = angular.module('import', ['ideUI', 'ideView', 'ideWorkspace', 'ideTransport', 'angularFileUpload']);

importView.controller('ImportViewController', [
    '$scope',
    'messageHub',
    'workspaceApi',
    'transportApi',
    'FileUploader',
    function (
        $scope,
        messageHub,
        workspaceApi,
        transportApi,
        FileUploader,
    ) {
        let transportUrl = transportApi.getProjectImportUrl();
        $scope.selectedWorkspace = { name: 'workspace' }; // Default
        $scope.workspaceNames = [];
        $scope.uploader = new FileUploader({
            url: transportUrl
        });

        $scope.uploader.filters.push({
            name: 'customFilter',
            fn: function (item /*{File|FileLikeObject}*/, options) {
                let type = item.type.slice(item.type.lastIndexOf('/') + 1);
                if (type != 'zip' && type != 'x-zip' && type != 'x-zip-compressed') {
                    return false;
                }
                return this.queue.length < 100;
            }
        });

        $scope.uploader.onBeforeUploadItem = function (item) {
            item.url = transportUrl + "/" + $scope.selectedWorkspace.name;
        };

        $scope.uploader.onCompleteAll = function () {
            messageHub.postMessage('ide.workspace.changed', { workspace: $scope.selectedWorkspace.name }, true);
        };

        $scope.isSelectedWorkspace = function (name) {
            if ($scope.selectedWorkspace.name === name) return true;
            return false;
        };

        $scope.canUpload = function () {
            if ($scope.uploader.getNotUploadedItems().length) return '';
            return 'disabled';
        };

        $scope.addFiles = function () {
            document.getElementById('input').click();
        };

        $scope.switchWorkspace = function (workspace) {
            if ($scope.selectedWorkspace.name !== workspace) {
                $scope.selectedWorkspace.name = workspace;
            }
        };

        $scope.reloadWorkspaceList = function () {
            let userSelected = JSON.parse(localStorage.getItem('DIRIGIBLE.workspace') || '{}');
            if (!userSelected.name) {
                $scope.selectedWorkspace.name = 'workspace'; // Default
            } else {
                $scope.selectedWorkspace.name = userSelected.name;
            }
            workspaceApi.listWorkspaceNames().then(function (response) {
                if (response.status === 200)
                    $scope.workspaceNames = response.data;
                else messageHub.setStatusError('Unable to load workspace list');
            });
        };

        messageHub.onDidReceiveMessage(
            'ide.workspaces.changed',
            function () {
                $scope.reloadWorkspaceList();
            },
            true
        );

        // Initialization
        $scope.reloadWorkspaceList();
    }]);