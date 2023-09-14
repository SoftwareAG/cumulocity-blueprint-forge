# Cumulocity package blueprint

Blueprint Forge enables template driven approach of integrating pre-build and market-ready industry solutions
with a seemless user experience. 

![BlueprintForge](assets/blueprint-forge.png)

## Features
* **Market-ready solutions:** Blueprint Forge support template-driven approach which Enable delivery and maintenance of pre-built and market-ready industry solutions with a seamless user experience. As in initial version, we have Field Services, Predictive Maintenance and Demo Template as our pre-built market-ready solutions.
* **Easy Customization:** Simplified customization to configure dashboard, devices, widgets and microservices.
* **Dashboard Catalog:** User can select any pre-designed template for dashboard and ability to install dependent widgets.
* **Installation of plugins and microservice:** Provides option to install plugins and microservices while creating an application.
* **Provision to add essential dashboards:** Effortlessly Craft Applications Using Demo Template's Essential Dashboards and Features – Explore the Overview, Receive a Warm Welcome, Find Help and Support.
* **Blank Template support:** The Blank Template Lets You Build Applications from Scratch, No Dashboards or Plugins Preselected.
* **Support for Device group and Asset Type:** Link not just devices, user can also link Device Group and Asset type with the dashboard.
* **Configure while creating:** User can configure the application while creating it.
* **Custom Branding:** Provides flexibility and control over application’s look and feel. Now user can use color picker to choose millions of colors to customize branding. Header, Action bar and tab bar are also customizable. User can add his own branding by choosing different colors of his choice in the application. 
## Installation

### Install Blueprint Forge

1. Grab the **[Latest Release Zip](https://github.com/SoftwareAG/cumulocity-blueprint-forge/releases)**
2. Go to the **Administration view** in your tenant (/apps/administration)
3. Open the **Ecosystem** section in the navigator and click **Applications**
4. Go to **Packages**
5. Click **Add Package**
6. Drop zip file or select from your system location.
7. Click **Done**

### Incremental Upgrade

1. Grab the **[Latest Release Zip](https://github.com/SoftwareAG/cumulocity-blueprint-forge/releases)**
2. Go to the **Administration view** in your tenant (/apps/administration)
3. Open the **Ecosystem** section in the navigator and click **Applications**
4. Go to **Packages**
5. Click **Blueprint Forge**
6. Click "Version"
7. Drop zip file or select from your system location.
8. Click **Done**

## QuickStart

This guide will teach you how to create your first application using the Blueprint Forge.

**NOTE:** This guide assumes you have followed the [Installation instructions](#Installation)

1. Open the Blueprint Forge package which was installed (refer to Installation step)
2. Click `Deploy application`
3. Enter the application details and click `Save`


You have created an application.

4. Navigate to the application created.
5. Click on Open and you can see the welcome screen.
6. Click on `Start`.
7. You will see the list of templates, click any of the template using which you want to create an application.
8. You will see the details page, click on continue.
9. Select the dashboards, plugins and microservices of you choice.
10. Fill the device details if it is required by the dashboard.
11. You can also fill the configuration for the widgets if needed.
12. Click on `Continue`.
13. It will take a while to install the dependent packages. Then click on `Save and Reload`.

Congratulations! You have successfully created an application using Blueprint Forge with template of your choice.

### User Guide

#### How to upgrade Blueprint Forge application

Blueprint Forge application can be upgraded if new version update is available. If newer update is available, an icon (on hover of it, it shows "Update available") is seen next to the application version below the application name. 

Follow below steps to upgrade your application:

1. Go to Applications -> All applications. 
2. Click on the Blueprint Forge application name which is created. You will be navigated to Application Properties.
3. You will see "Update available" button in the Properties. Click on it.
4. Pop up appears for confirmation. Click on "Update" to upgrade your application.

Congratulations! You have successfully updated your application. You can see the latest version next to your application name.


In order to deploy an application, use `npm run deploy` or build it with `npm run build`, zip application files and upload manually as a package in your tenant Administration application. 

