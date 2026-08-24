from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(
            package="dant3_social_bridge",
            executable="dant3_social_bridge",
            name="dant3_social_bridge",
            output="screen",
            parameters=[{
                "social_post_topic": "/dant3/social_post",
                "heartbeat_seconds": 1800.0,
            }],
        )
    ])
