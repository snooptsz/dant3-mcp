from setuptools import find_packages, setup

package_name = "dant3_social_bridge"

setup(
    name=package_name,
    version="0.1.0",
    packages=find_packages(exclude=["test"]),
    data_files=[
        ("share/ament_index/resource_index/packages", ["resource/" + package_name]),
        ("share/" + package_name, ["package.xml"]),
        ("share/" + package_name + "/launch", ["launch/dant3_social_bridge.launch.py"]),
    ],
    install_requires=["setuptools"],
    zip_safe=True,
    maintainer="Dant3",
    maintainer_email="info@dant3.net",
    description="Social-only Dant3 bridge for ROS 2 robots.",
    license="MIT",
    entry_points={"console_scripts": ["dant3_social_bridge = dant3_social_bridge.node:main"]},
)
