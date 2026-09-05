"""
Comprehensive Job Seeder and Skill Intelligence Runner.
Seeds realistic market jobs for Robotics, Embedded Systems, IoT, Cybersecurity,
AI/ML, SWE, Cloud/DevOps, and runs the skill extraction & role classification pipeline.
"""

import sys
import os
import json
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Setup paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.app.core.database import SessionLocal, engine
from backend.app.models import Job, JobSkill, Role, RoleFamily, Skill
from backend.app.services.skill_intelligence.pipeline import SkillIntelligencePipeline

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("seed_jobs")

COMPREHENSIVE_JOBS = [
    # ------------------ ROBOTICS & EMBEDDED SYSTEMS ------------------
    {
        "title": "Robotics Software Engineer - Autonomous Systems",
        "company": "GreyOrange Robotics",
        "location": "Bengaluru, India",
        "role_name": "Robotics Engineer",
        "description": """
        GreyOrange is looking for a Robotics Software Engineer to develop core algorithms for autonomous mobile robots (AMR).
        Responsibilities:
        - Design and implement navigation, SLAM, and path planning algorithms using ROS and ROS2.
        - Develop motion control and trajectory optimization in C++ and Python on Linux systems.
        - Integrate sensors including LiDAR, IMU, ultrasonic, and depth cameras for obstacle avoidance.
        - Simulate multi-robot fleet maneuvers in Gazebo simulation environments.
        - Analyze robot kinematics and dynamic stability for warehouse fulfillment platforms.
        Requirements:
        - Strong proficiency in C++ and Python programming.
        - Hands-on experience with ROS / ROS2, Gazebo, and MoveIt.
        - Deep understanding of SLAM (visual SLAM, LiDAR SLAM) and Kalman filtering.
        - Experience with sensors and actuators integration.
        """,
        "source": "greenhouse",
        "salary_min": 1400000,
        "salary_max": 2400000,
        "job_type": "FULL_TIME",
        "experience_level": "MID"
    },
    {
        "title": "Junior Robotics Engineer - Perception & Navigation",
        "company": "ABB Robotics",
        "location": "Bengaluru, India",
        "role_name": "Robotics Engineer",
        "description": """
        ABB Robotics is hiring an Associate Robotics Engineer for robotic manipulator automation and sensor fusion.
        Key Responsibilities:
        - Program robotic arms and autonomous guided vehicles (AGV) using ROS and C++.
        - Implement 2D/3D perception pipelines using OpenCV and Point Cloud Library.
        - Perform forward and inverse kinematics calculations for multi-axis industrial robots.
        - Test and validate control algorithms using MATLAB and Simulink.
        - Troubleshoot microcontrollers, CAN bus, and motor drives in physical prototypes.
        Qualifications:
        - B.Tech/M.Tech in Robotics, Mechatronics, Mechanical, or Computer Science.
        - Experience with ROS, C++, Python, kinematics, and OpenCV.
        """,
        "source": "lever",
        "salary_min": 800000,
        "salary_max": 1500000,
        "job_type": "FULL_TIME",
        "experience_level": "ENTRY"
    },
    {
        "title": "Robotics Engineer - SLAM & Localization",
        "company": "Tesla Autopilot & Robotics",
        "location": "Remote / Bengaluru, India",
        "role_name": "Robotics Engineer",
        "description": """
        Tesla is seeking a Robotics Engineer to work on state estimation and SLAM for humanoid robotics and autonomous systems.
        What you'll do:
        - Develop robust real-time SLAM algorithms fusing LiDAR, stereo vision, and IMU data.
        - Optimize low-latency motion planning and obstacle avoidance in ROS2 and C++.
        - Conduct simulation experiments in Gazebo and real hardware test tracks.
        - Work with PID controllers and state-space control models for balance dynamics.
        Requirements:
        - BS/MS in Robotics, Aerospace, or Electrical Engineering.
        - Proven skills in C++, ROS2, SLAM, Gazebo, kinematics, and sensors.
        """,
        "source": "workable",
        "salary_min": 1800000,
        "salary_max": 3200000,
        "job_type": "FULL_TIME",
        "experience_level": "SENIOR"
    },
    {
        "title": "Embedded Systems Engineer - Firmware Development",
        "company": "Qualcomm",
        "location": "Hyderabad, India",
        "role_name": "Embedded Systems Engineer",
        "description": """
        Qualcomm is hiring an Embedded Systems Engineer to build bare-metal firmware and RTOS applications.
        Duties:
        - Develop device drivers and low-level firmware in Embedded C and C++.
        - Implement deterministic task scheduling using FreeRTOS and Zephyr RTOS.
        - Program ARM Cortex-M and STM32 microcontrollers.
        - Debug hardware communication protocols: I2C, SPI, UART, and CAN bus using logic analyzers.
        - Participate in PCB design review and schematic validation with hardware engineers.
        Requirements:
        - Strong background in Embedded C, microcontrollers (STM32/ESP32), RTOS, and communication protocols.
        """,
        "source": "greenhouse",
        "salary_min": 1200000,
        "salary_max": 2200000,
        "job_type": "FULL_TIME",
        "experience_level": "MID"
    },
    {
        "title": "Firmware & Microcontroller Engineer",
        "company": "Bosch Global Software",
        "location": "Pune, India",
        "role_name": "Embedded Systems Engineer",
        "description": """
        Bosch is seeking a Firmware Engineer for automotive electronic control units.
        Responsibilities:
        - Develop real-time embedded software in Embedded C on STM32 and Arduino boards.
        - Implement FreeRTOS task synchronization, semaphores, and interrupt service routines.
        - Validate CAN bus communication and diagnostics using CANalyzer.
        - Interface analog and digital sensors and actuators.
        Skills:
        - Embedded C, RTOS, microcontrollers, STM32, I2C, SPI, CAN bus.
        """,
        "source": "lever",
        "salary_min": 750000,
        "salary_max": 1400000,
        "job_type": "FULL_TIME",
        "experience_level": "ENTRY"
    },
    {
        "title": "IoT & Edge Systems Engineer",
        "company": "Siemens Technology",
        "location": "Bengaluru, India",
        "role_name": "IoT & Firmware Engineer",
        "description": """
        Siemens is looking for an IoT Engineer to build connected smart sensor networks.
        Requirements:
        - Program ESP32 and STM32 microcontrollers in Embedded C and Python.
        - Implement telemetry protocols including MQTT, HTTP, and WebSockets.
        - Interface industrial sensors and actuators over RS485 and Modbus.
        - Maintain cloud connectivity with AWS IoT Core and Azure IoT Hub.
        Skills:
        - Microcontrollers, Embedded C, FreeRTOS, MQTT, Python, I2C, SPI, Sensors & Actuators.
        """,
        "source": "greenhouse",
        "salary_min": 1000000,
        "salary_max": 1800000,
        "job_type": "FULL_TIME",
        "experience_level": "MID"
    },
    {
        "title": "Automation & Controls Engineer",
        "company": "Schneider Electric",
        "location": "Chennai, India",
        "role_name": "Automation & Controls Engineer",
        "description": """
        Schneider Electric is hiring an Automation & Controls Engineer.
        Responsibilities:
        - Design and program PLC systems (Siemens, Rockwell Allen-Bradley) using Ladder Logic.
        - Build SCADA supervisory dashboards and HMI interfaces.
        - Tune PID controllers and closed-loop feedback systems for industrial plants.
        - Integrate servo drives and industrial robotics arms.
        Skills:
        - PLC, SCADA, PID control, industrial automation, sensors & actuators.
        """,
        "source": "workable",
        "salary_min": 900000,
        "salary_max": 1600000,
        "job_type": "FULL_TIME",
        "experience_level": "MID"
    },
    {
        "title": "Hardware & PCB Design Engineer",
        "company": "Texas Instruments",
        "location": "Bengaluru, India",
        "role_name": "Hardware / PCB Design Engineer",
        "description": """
        TI is looking for a Hardware Design Engineer to architect multi-layer high-speed PCBs.
        Key Tasks:
        - Create schematic designs and layout multilayer circuit boards in Altium Designer and KiCad.
        - Perform signal integrity and power integrity simulations.
        - Fabricate and assemble SMD prototypes with microcontrollers and power management ICs.
        - Debug boards using oscilloscopes, function generators, and spectrum analyzers.
        Skills:
        - PCB design, Altium Designer, KiCad, circuit design, microcontrollers, CAD.
        """,
        "source": "greenhouse",
        "salary_min": 1100000,
        "salary_max": 2000000,
        "job_type": "FULL_TIME",
        "experience_level": "MID"
    },

    # ------------------ CYBERSECURITY ------------------
    {
        "title": "Cybersecurity Analyst - SOC Operations",
        "company": "Wipro Cybersecurity",
        "location": "Bengaluru, India",
        "role_name": "Cybersecurity Analyst",
        "description": """
        Join Wipro as a Cybersecurity Analyst monitoring enterprise networks 24/7.
        Responsibilities:
        - Investigate security alerts using SIEM tools (Splunk, Microsoft Sentinel).
        - Perform packet inspection with Wireshark and analyze network traffic.
        - Conduct vulnerability scans and OWASP top 10 security audits.
        - Execute penetration testing on web applications and APIs.
        Skills:
        - Cybersecurity, SIEM, Wireshark, OWASP, penetration testing, network security.
        """,
        "source": "lever",
        "salary_min": 700000,
        "salary_max": 1300000,
        "job_type": "FULL_TIME",
        "experience_level": "ENTRY"
    },
    {
        "title": "Information Security Engineer",
        "company": "CrowdStrike",
        "location": "Pune, India",
        "role_name": "Cybersecurity Analyst",
        "description": """
        CrowdStrike is looking for a Security Engineer to safeguard cloud and container environments.
        Skills:
        - Cybersecurity, infosec, network security, Python scripting, OWASP, vulnerability management.
        """,
        "source": "greenhouse",
        "salary_min": 1500000,
        "salary_max": 2600000,
        "job_type": "FULL_TIME",
        "experience_level": "MID"
    },

    # ------------------ AI & MACHINE LEARNING ------------------
    {
        "title": "Computer Vision Engineer - Autonomous Perception",
        "company": "Ola Electric Mobility",
        "location": "Bengaluru, India",
        "role_name": "Computer Vision Engineer",
        "description": """
        Ola Electric is seeking a Computer Vision Engineer for autonomous navigation perception.
        Tasks:
        - Train deep convolutional neural networks and Vision Transformers using PyTorch and TensorFlow.
        - Implement real-time object detection and semantic segmentation using OpenCV and TensorRT.
        - Optimize visual SLAM and depth estimation for mobile embedded edge processors.
        Requirements:
        - Python, C++, OpenCV, PyTorch, Deep Learning, Computer Vision, SLAM.
        """,
        "source": "workable",
        "salary_min": 1600000,
        "salary_max": 2800000,
        "job_type": "FULL_TIME",
        "experience_level": "MID"
    },
    {
        "title": "Generative AI & LLM Systems Engineer",
        "company": "Anthropic Partner Lab",
        "location": "Bengaluru, India",
        "role_name": "AI Engineer",
        "description": """
        Build production agent workflows and multi-modal neural network pipelines.
        Requirements:
        - Python, Generative AI, Large Language Models, PyTorch, LangChain, FastAPI, Docker.
        """,
        "source": "greenhouse",
        "salary_min": 1800000,
        "salary_max": 3000000,
        "job_type": "FULL_TIME",
        "experience_level": "SENIOR"
    }
]

def seed_and_index_jobs():
    db = SessionLocal()
    pipeline = SkillIntelligencePipeline()
    try:
        logger.info("Starting multi-domain job seeding...")
        inserted = 0

        import hashlib
        for item in COMPREHENSIVE_JOBS:
            # Check if role exists
            role_record = db.query(Role).filter(Role.name.ilike(item["role_name"])).first()
            if not role_record:
                # Find by substring
                role_record = db.query(Role).filter(Role.name.ilike(f"%{item['role_name']}%")).first()

            role_id = role_record.id if role_record else "ROL_ROBOTICS_ENGINEER"

            # Check if job already exists
            existing = db.query(Job).filter(
                Job.title == item["title"],
                Job.company_name == item["company"]
            ).first()

            if not existing:
                job_id = f"job_seed_{int(datetime.now(timezone.utc).timestamp())}_{inserted}"
                chash = hashlib.sha256(f"{item['title']}_{item['company']}_{item['location']}".encode()).hexdigest()
                job = Job(
                    id=job_id,
                    source=item["source"],
                    source_job_id=f"seed_{inserted}",
                    canonical_role=item["role_name"],
                    role_id=role_id,
                    role_confidence=0.98,
                    role_classification_method="EXPLICIT_SEED",
                    title=item["title"],
                    company_name=item["company"],
                    location=item["location"],
                    country="IN",
                    job_type="Full-time",
                    description=item["description"].strip(),
                    salary_min=item.get("salary_min"),
                    salary_max=item.get("salary_max"),
                    currency="INR",
                    posted_at=datetime.now(timezone.utc) - timedelta(days=inserted % 15),
                    job_url=f"https://careers.example.com/jobs/{inserted}",
                    remote="Remote" in item["location"],
                    status="ACTIVE",
                    processing_state="RAW",
                    content_hash=chash
                )
                db.add(job)
                inserted += 1

        db.commit()
        logger.info(f"Successfully inserted {inserted} new domain jobs.")

        # Run pipeline to extract skills and index role intelligence
        logger.info("Running Skill Intelligence Pipeline over all RAW jobs...")
        stats = pipeline.process_jobs()
        logger.info(f"Pipeline completed: {stats}")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding jobs: {e}", exc_info=True)
    finally:
        db.close()

if __name__ == "__main__":
    seed_and_index_jobs()
